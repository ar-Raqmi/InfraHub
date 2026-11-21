import React, { useEffect } from 'react';
import { PresetGroup } from '../../../types';
import MobileBackBar from './MobileBackBar';
import KontrakMovedBanner from './KontrakMovedBanner';
import LibraryCategoryList from './LibraryCategoryList';
import LibraryGroupList from './LibraryGroupList';
import LibraryGroupEditor from './LibraryGroupEditor';
import LibraryItemEditor from './LibraryItemEditor';
import LibrarySaveBar from './LibrarySaveBar';
import { LibraryActions } from './libraryTypes';
import { SettingsRoute } from './useSettingsRoute';

interface LibraryMobileProps {
  route: SettingsRoute;
  groups: PresetGroup[];
  actions: LibraryActions;
  go: (route: SettingsRoute) => void;
  replace: (route: SettingsRoute) => void;
  back: () => void;
}

// Pustaka on a phone: Kategori > Kumpulan > Edit Kumpulan > Item, one level per screen.
const LibraryMobile: React.FC<LibraryMobileProps> = ({ route, groups, actions, go, replace, back }) => {
  const { cat, groupId, itemId } = route;
  const group = groupId ? groups.find(g => g.id === groupId) : undefined;
  const itemIndex = group && itemId ? group.items.findIndex(i => i.id === itemId) : -1;
  const item = itemIndex >= 0 ? group!.items[itemIndex] : undefined;
  const isLoaded = groups.length > 0;
  const isStale = isLoaded && ((groupId && !group) || (itemId && !item));

  // A group or item that was deleted or moved away leaves the route pointing at nothing.
  // Before the library has loaded every id looks missing, so a reload must not count.
  useEffect(() => {
    if (!isStale) return;
    replace(group ? { sec: 'pustaka', cat, groupId } : { sec: 'pustaka', cat });
  }, [isStale]);

  let screen: React.ReactNode;
  let backLabel = 'Tetapan';
  if (group && item) {
    backLabel = 'Edit Kumpulan';
    screen = <LibraryItemEditor group={group} item={item} index={itemIndex} actions={actions} onDone={back} />;
  } else if (group) {
    backLabel = cat || 'Pustaka BQ';
    screen = <LibraryGroupEditor group={group} actions={actions} onOpenItem={id => go({ sec: 'pustaka', cat, groupId: group.id, itemId: id })} />;
  } else if (cat) {
    backLabel = 'Pustaka BQ';
    screen = (
      <LibraryGroupList
        category={cat}
        groups={groups.filter(g => g.category === cat)}
        actions={actions}
        onOpen={id => go({ sec: 'pustaka', cat, groupId: id })}
        onRenamed={name => replace({ sec: 'pustaka', cat: name })}
      />
    );
  } else {
    screen = <LibraryCategoryList groups={groups} actions={actions} onOpen={name => go({ sec: 'pustaka', cat: name })} />;
  }

  return (
    <div className="md:hidden pb-36 space-y-4">
      <MobileBackBar label={backLabel} onBack={back} />
      {!cat && <KontrakMovedBanner variant="pustaka" />}
      {screen}
      {actions.selectedItemIds.size === 0 && <LibrarySaveBar isDirty={actions.isDirty} status={actions.saveStatus} onSave={actions.onSave} />}
    </div>
  );
};

export default LibraryMobile;
