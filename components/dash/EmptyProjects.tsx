import React from 'react';
import { SearchX } from 'lucide-react';
import { Button, EmptyState } from '../ui';

const EmptyProjects: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <EmptyState
    icon={SearchX}
    title="Tiada projek dijumpai"
    body="Tiada projek yang sepadan dengan carian atau status yang dipilih."
    action={<Button variant="outline" onClick={onClear}>Kosongkan tapisan</Button>}
  />
);

export default EmptyProjects;
