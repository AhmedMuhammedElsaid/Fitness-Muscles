import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/ui';
import { LibraryView } from '@/features/programs/LibraryView';
import { WorkoutsView } from '@/features/programs/WorkoutsView';
import { PlansView } from '@/features/programs/PlansView';

type SegmentKey = 'library' | 'workouts' | 'plans';

export default function ProgramsScreen() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<SegmentKey>('library');

  const segments = [
    { key: 'library', label: t('coach.programs.library', 'Library') },
    { key: 'workouts', label: t('coach.programs.workouts', 'Workouts') },
    { key: 'plans', label: t('coach.programs.plans', 'Plans') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-7 pt-4 pb-3">
        <SegmentedControl
          segments={segments}
          value={segment}
          onChange={(key) => setSegment(key as SegmentKey)}
        />
      </View>
      <View className="flex-1">
        {segment === 'library' ? (
          <LibraryView />
        ) : segment === 'workouts' ? (
          <WorkoutsView />
        ) : (
          <PlansView />
        )}
      </View>
    </SafeAreaView>
  );
}
