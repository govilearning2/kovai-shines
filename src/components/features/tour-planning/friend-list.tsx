
'use client';

import { useState } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';

const friends = [
  { value: 'Alice Smith', label: 'Alice Smith' },
  { value: 'Bob Johnson', label: 'Bob Johnson' },
  { value: 'Charlie Brown', label: 'Charlie Brown' },
  { value: 'Diana Prince', label: 'Diana Prince' },
  { value: 'Ethan Hunt', label: 'Ethan Hunt' },
];

type FriendListProps = {
  onSelectionChange: (selected: string[]) => void;
};

export function FriendList({ onSelectionChange }: FriendListProps) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleSelectionChange = (selected: string[]) => {
    setSelectedFriends(selected);
    onSelectionChange(selected);
  };

  return (
    <div className="space-y-2">
        <Label>Invite Friends</Label>
        <MultiSelect
            options={friends}
            selected={selectedFriends}
            onChange={handleSelectionChange}
            placeholder="Select friends..."
            className="w-full"
        />
    </div>
  );
}
