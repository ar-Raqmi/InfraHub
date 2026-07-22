import { BaseRepository } from './BaseRepository'

export class StorageRepository extends BaseRepository {
  private bucket: R2Bucket;

  constructor(db: D1Database, bucket: R2Bucket) {
    super(db);
    this.bucket = bucket;
  }

  private mapTemporaryImageFromRow(row: any): any {
    return {
      id: row.id,
      createdAt: row.created_at,
      userId: row.user_id,
      userFullName: row.user_full_name,
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url || row.image_url,
      projectId: row.project_id,
      locationTag: row.location_tag
    };
  }

  public async getGallery(limit: number, offset: number): Promise<any[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM temporary_gallery ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();
    return results.map(row => this.mapTemporaryImageFromRow(row));
  }

  public async upload(
    file: File,
    userId: string,
    userFullName: string,
    projectId?: string,
    location?: string
  ): Promise<any> {
    let arrayBuffer: ArrayBuffer;
    if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function') {
      arrayBuffer = await file.arrayBuffer();
    } else if (file) {
      arrayBuffer = await new Response(file as any).arrayBuffer();
    } else {
      throw new Error('Invalid file upload');
    }

    const fileExt = 'jpg';
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const contentType = (typeof file === 'object' && file.type) || 'image/jpeg';

    await this.bucket.put(fileName, arrayBuffer, {
      httpMetadata: { contentType }
    });

    const imageUrl = `/api/storage/file/${fileName}`;
    const newId = timestamp.toString();
    const dbItem = {
      id: newId,
      user_id: Number(userId),
      user_full_name: userFullName,
      image_url: imageUrl,
      thumbnail_url: null,
      project_id: projectId ? Number(projectId) : null,
      location_tag: location || null,
      created_at: new Date().toISOString()
    };

    const { keys, values, placeholders } = this.buildInsert(dbItem);

    await this.db.prepare(`INSERT INTO temporary_gallery (${keys.join(', ')}) VALUES (${placeholders})`)
      .bind(...values)
      .run();

    return this.mapTemporaryImageFromRow(dbItem);
  }

  public async getFile(filename: string): Promise<any | null> {
    return this.bucket.get(filename);
  }

  public async updateLocation(id: string, location: string): Promise<boolean> {
    await this.db.prepare('UPDATE temporary_gallery SET location_tag = ? WHERE id = ?')
      .bind(location, id)
      .run();
    return true;
  }

  public async delete(id: string): Promise<boolean> {
    const row: any = await this.db.prepare('SELECT image_url, thumbnail_url FROM temporary_gallery WHERE id = ?')
      .bind(id)
      .first();

    if (row) {
      const parts = row.image_url.split('/');
      const fileName = parts[parts.length - 1];
      await this.bucket.delete(fileName);

      if (row.thumbnail_url) {
        const thumbParts = row.thumbnail_url.split('/');
        const thumbFileName = thumbParts[thumbParts.length - 1];
        await this.bucket.delete(thumbFileName);
      }
    }

    await this.db.prepare('DELETE FROM temporary_gallery WHERE id = ?').bind(id).run();
    return true;
  }

  public async cleanup(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { results: expiredImages } = await this.db.prepare(
      'SELECT id, image_url, thumbnail_url FROM temporary_gallery WHERE created_at < ?'
    ).bind(twentyFourHoursAgo).all();

    if (expiredImages && expiredImages.length > 0) {
      const ids = [];
      for (const img of expiredImages) {
        ids.push(img.id);
        const parts = (img.image_url as string).split('/');
        const fileName = parts[parts.length - 1];
        await this.bucket.delete(fileName);

        if (img.thumbnail_url) {
          const thumbParts = (img.thumbnail_url as string).split('/');
          const thumbFileName = thumbParts[thumbParts.length - 1];
          await this.bucket.delete(thumbFileName);
        }
      }

      const pl = ids.map(() => '?').join(',');
      await this.db.prepare(`DELETE FROM temporary_gallery WHERE id IN (${pl})`).bind(...ids).run();
      return expiredImages.length;
    }

    return 0;
  }
}
