import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import {
  coachClientsCollection,
  planAssignmentsCollection,
  planDaysCollection,
  plansCollection,
  workoutsCollection,
} from '@/db/collections';
import { assignPlan, clearPlanDay, createPlan, setPlanDay } from '@/db/mutations';
import { FlashList } from '@/lib/list';
import { PrimaryButton, SecondaryButton, TextInput, Card } from '@/components/ui';
import { firstError } from '@/lib/formError';
import type { Tables } from '@/types/db';

type Plan = Tables<'plans'>;
type PlanDay = Tables<'plan_days'>;
type Workout = Tables<'workouts'>;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  durationWeeks: z
    .string()
    .refine((v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) >= 1 && parseInt(v, 10) <= 52, {
      message: '1–52 weeks',
    }),
  description: z.string(),
});


function PlanGrid({
  plan,
  planDays,
  workouts,
  onCellPress,
}: {
  plan: Plan;
  planDays: PlanDay[];
  workouts: Workout[];
  onCellPress: (weekNumber: number, dayOfWeek: number, existing: PlanDay | undefined) => void;
}) {
  const durationWeeks = plan.duration_weeks ?? 1;

  const getDayEntry = (week: number, day: number): PlanDay | undefined =>
    planDays.find((pd) => pd.plan_id === plan.id && pd.week_number === week && pd.day_of_week === day);

  const getWorkoutName = (workoutId: string | null): string => {
    if (!workoutId) return 'Rest';
    return workouts.find((w) => w.id === workoutId)?.name ?? '?';
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View>
        {/* Header row */}
        <View className="flex-row mb-1">
          <View className="w-10" />
          {DAY_LABELS.map((d) => (
            <View key={d} className="w-20 items-center">
              <Text className="text-text-secondary font-sans text-xs">{d}</Text>
            </View>
          ))}
        </View>

        {Array.from({ length: durationWeeks }, (_, i) => i + 1).map((week) => (
          <View key={week} className="flex-row mb-1">
            <View className="w-10 justify-center">
              <Text className="text-text-muted font-sans text-xs">W{week}</Text>
            </View>
            {Array.from({ length: 7 }, (_, day) => {
              const entry = getDayEntry(week, day);
              const hasWorkout = entry?.workout_id != null;
              const isRest = entry && !entry.workout_id;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => onCellPress(week, day, entry)}
                  className={`w-20 h-12 mr-0.5 rounded items-center justify-center ${
                    hasWorkout
                      ? 'bg-primary/20 border border-primary/40'
                      : isRest
                        ? 'bg-surface border border-surface'
                        : 'bg-surface/40 border border-dashed border-surface'
                  }`}
                >
                  <Text
                    className={`font-sans text-xs text-center px-1 ${
                      hasWorkout ? 'text-primary' : isRest ? 'text-text-muted' : 'text-surface/0'
                    }`}
                    numberOfLines={2}
                  >
                    {entry ? getWorkoutName(entry.workout_id) : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function PlansView() {
  const { t } = useTranslation();
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: planDays } = useLiveQuery(planDaysCollection);
  const { data: workouts } = useLiveQuery(workoutsCollection);
  const { data: clients } = useLiveQuery(coachClientsCollection);
  const { data: assignments } = useLiveQuery(planAssignmentsCollection);

  const [createVisible, setCreateVisible] = useState(false);
  const [gridPlan, setGridPlan] = useState<Plan | null>(null);
  const [cellModalState, setCellModalState] = useState<{
    weekNumber: number;
    dayOfWeek: number;
    existing: PlanDay | undefined;
  } | null>(null);
  const [assignPlanTarget, setAssignPlanTarget] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const plansList = (plans ?? []) as Plan[];
  const planDaysList = (planDays ?? []) as PlanDay[];
  const workoutsList = (workouts ?? []) as Workout[];
  const clientsList = (clients ?? []).filter((c) => c.status === 'active');

  const createForm = useForm({
    defaultValues: { name: '', durationWeeks: '4', description: '' },
    validators: { onChange: planSchema },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        const planId = await createPlan({
          name: value.name,
          durationWeeks: parseInt(value.durationWeeks, 10),
          description: value.description || null,
        });
        setCreateVisible(false);
        createForm.reset();
        // The optimistic insert already put it in plansList; find it by id.
        const newPlan = plansCollection.state.get(planId);
        if (newPlan) setGridPlan(newPlan as unknown as Plan);
      } finally {
        setSaving(false);
      }
    },
  });

  const handleCellPress = (
    weekNumber: number,
    dayOfWeek: number,
    existing: PlanDay | undefined,
  ) => {
    setCellModalState({ weekNumber, dayOfWeek, existing });
  };

  const handleSetWorkout = async (workoutId: string | null) => {
    if (!gridPlan || !cellModalState) return;
    setSaving(true);
    try {
      if (cellModalState.existing) {
        await clearPlanDay(cellModalState.existing.id);
      }
      if (workoutId !== null) {
        await setPlanDay({
          planId: gridPlan.id,
          weekNumber: cellModalState.weekNumber,
          dayOfWeek: cellModalState.dayOfWeek,
          workoutId,
        });
      } else if (workoutId === null && !cellModalState.existing) {
        // Set as rest day explicitly
        await setPlanDay({
          planId: gridPlan.id,
          weekNumber: cellModalState.weekNumber,
          dayOfWeek: cellModalState.dayOfWeek,
          workoutId: null,
        });
      }
      setCellModalState(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (clientId: string, startDate: string) => {
    if (!assignPlanTarget) return;
    setSaving(true);
    try {
      const existing = (assignments ?? []).find(
        (a) => a.client_id === clientId && (a.status === 'active' || a.status === 'paused'),
      );
      if (existing) {
        Alert.alert(
          t('coach.plans.replaceTitle', 'Replace Active Plan?'),
          t('coach.plans.replaceConfirm', "This client has an active plan. Their history will be preserved."),
          [
            { text: t('common.cancel', 'Cancel'), style: 'cancel' },
            {
              text: t('coach.plans.replace', 'Replace'),
              onPress: async () => {
                await assignPlan({
                  planId: assignPlanTarget.id,
                  clientId,
                  startDate,
                  replaceAssignmentId: existing.id,
                });
                setAssignPlanTarget(null);
              },
            },
          ],
        );
      } else {
        await assignPlan({ planId: assignPlanTarget.id, clientId, startDate });
        setAssignPlanTarget(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const [assignClientId, setAssignClientId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  // Refresh gridPlan reference from live data when returning to grid view
  const liveGridPlan = gridPlan
    ? plansList.find((p) => p.id === gridPlan.id) ?? gridPlan
    : null;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        {liveGridPlan ? (
          /* ── Grid Editor View ── */
          <View className="flex-1">
            <View className="px-7 pt-4 pb-3 flex-row justify-between items-center">
              <TouchableOpacity onPress={() => setGridPlan(null)} className="mr-3">
                <Text className="text-primary font-sans text-sm">← Back</Text>
              </TouchableOpacity>
              <Text className="text-white font-sans font-semibold flex-1" numberOfLines={1}>
                {liveGridPlan.name}
              </Text>
              <TouchableOpacity
                onPress={() => setAssignPlanTarget(liveGridPlan)}
                className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-2"
              >
                <Text className="text-primary font-sans text-xs font-medium">
                  {t('coach.plans.assign', 'Assign')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 px-7">
              <Text className="text-text-secondary font-sans text-xs mb-3">
                {t('coach.plans.tapCell', 'Tap a cell to set a workout or rest day')}
              </Text>
              <PlanGrid
                plan={liveGridPlan}
                planDays={planDaysList.filter((pd) => pd.plan_id === liveGridPlan.id)}
                workouts={workoutsList}
                onCellPress={handleCellPress}
              />
            </ScrollView>
          </View>
        ) : (
          /* ── Plans List View ── */
          <>
            <View className="px-7 pt-4 pb-3 flex-row justify-between items-center">
              <Text className="text-white font-sans text-xl font-semibold">
                {t('coach.plans.title', 'Plans')}
              </Text>
              <TouchableOpacity
                onPress={() => setCreateVisible(true)}
                className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-2"
              >
                <Text className="text-primary font-sans text-sm font-medium">
                  {t('coach.plans.addBtn', '+ New')}
                </Text>
              </TouchableOpacity>
            </View>
            {plansList.length === 0 ? (
              <View className="flex-1 items-center justify-center px-7">
                <Text className="text-text-secondary font-sans text-sm text-center">
                  {t('coach.plans.empty', 'No plans yet. Tap + New to create one.')}
                </Text>
              </View>
            ) : (
              <FlashList
                data={plansList}

                contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 32 }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setGridPlan(item)}>
                    <Card className="mb-3">
                      <Text className="text-white font-sans font-medium">{item.name}</Text>
                      <Text className="text-text-secondary font-sans text-xs mt-1">
                        {item.duration_weeks} {t('coach.plans.weeks', 'weeks')}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </View>

      {/* Create Plan Modal */}
      <Modal
        visible={createVisible}
        animationType="slide"
        onRequestClose={() => setCreateVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="px-7 pt-4 pb-2">
              <Text className="text-white font-sans text-lg font-semibold">
                {t('coach.plans.createTitle', 'New Plan')}
              </Text>
            </View>
            <ScrollView className="flex-1 px-7" keyboardShouldPersistTaps="handled">
              <View className="gap-4 py-4">
                <createForm.Field name="name">
                  {(f) => (
                    <TextInput
                      label={t('coach.plans.form.name', 'Plan Name *')}
                      placeholder="e.g. 4-Week Strength"
                      value={f.state.value}
                      onChangeText={f.handleChange}
                      onBlur={f.handleBlur}
                      error={firstError(f.state.meta.errors)}
                    />
                  )}
                </createForm.Field>
                <createForm.Field name="durationWeeks">
                  {(f) => (
                    <TextInput
                      label={t('coach.plans.form.durationWeeks', 'Duration (weeks)')}
                      keyboardType="number-pad"
                      value={f.state.value}
                      onChangeText={f.handleChange}
                      onBlur={f.handleBlur}
                      error={firstError(f.state.meta.errors)}
                    />
                  )}
                </createForm.Field>
                <createForm.Field name="description">
                  {(f) => (
                    <TextInput
                      label={t('coach.plans.form.description', 'Description')}
                      placeholder="Optional..."
                      multiline
                      numberOfLines={2}
                      value={f.state.value}
                      onChangeText={f.handleChange}
                    />
                  )}
                </createForm.Field>
                <PrimaryButton
                  title={saving ? t('common.saving', 'Saving...') : t('common.create', 'Create & Edit Grid')}
                  loading={saving}
                  onPress={() => createForm.handleSubmit()}
                />
                <SecondaryButton
                  title={t('common.cancel', 'Cancel')}
                  onPress={() => { setCreateVisible(false); createForm.reset(); }}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Cell picker modal */}
      <Modal
        visible={cellModalState !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCellModalState(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-7">
          <View className="bg-surface rounded-2xl p-5 w-full">
            <Text className="text-white font-sans font-semibold mb-1">
              {cellModalState
                ? `W${cellModalState.weekNumber} · ${DAY_LABELS[cellModalState.dayOfWeek]}`
                : ''}
            </Text>
            <Text className="text-text-secondary font-sans text-xs mb-4">
              {t('coach.plans.pickWorkout', 'Pick a workout or set as rest')}
            </Text>

            <ScrollView style={{ maxHeight: 280 }}>
              {workoutsList.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => handleSetWorkout(w.id)}
                  className="py-3 border-b border-surface"
                >
                  <Text className="text-white font-sans text-sm">{w.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => handleSetWorkout(null)}
              className="py-3 mt-1"
            >
              <Text className="text-text-secondary font-sans text-sm text-center">
                {t('coach.plans.restDay', '— Rest Day —')}
              </Text>
            </TouchableOpacity>

            {cellModalState?.existing && (
              <TouchableOpacity
                onPress={async () => {
                  if (!cellModalState.existing) return;
                  await clearPlanDay(cellModalState.existing.id);
                  setCellModalState(null);
                }}
                className="py-2"
              >
                <Text className="text-red-400 font-sans text-sm text-center">
                  {t('coach.plans.clearCell', 'Clear')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setCellModalState(null)} className="py-2">
              <Text className="text-text-muted font-sans text-sm text-center">
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Plan Modal */}
      <Modal
        visible={assignPlanTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignPlanTarget(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <SafeAreaView className="bg-surface rounded-t-2xl" edges={['bottom']}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View className="p-6">
                <Text className="text-white font-sans text-lg font-semibold mb-4">
                  {t('coach.plans.assignTitle', 'Assign Plan')}
                </Text>
                {assignPlanTarget && (
                  <Text className="text-text-secondary font-sans text-sm mb-4">
                    {assignPlanTarget.name}
                  </Text>
                )}

                <Text className="text-text-secondary font-sans text-xs mb-2">
                  {t('coach.plans.selectClient', 'Select Client')}
                </Text>
                <ScrollView style={{ maxHeight: 160 }} className="mb-4">
                  {clientsList.length === 0 ? (
                    <Text className="text-text-muted font-sans text-sm">
                      {t('coach.plans.noClients', 'No active clients')}
                    </Text>
                  ) : (
                    clientsList.map((c) => (
                      <TouchableOpacity
                        key={c.client_id}
                        onPress={() => setAssignClientId(c.client_id)}
                        className={`py-3 px-3 rounded-lg mb-1 ${
                          assignClientId === c.client_id ? 'bg-primary/20' : 'bg-background'
                        }`}
                      >
                        <Text
                          className={`font-sans text-sm ${
                            assignClientId === c.client_id ? 'text-primary' : 'text-white'
                          }`}
                        >
                          {c.client_id.slice(0, 8)}…
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>

                <TextInput
                  label={t('coach.plans.startDate', 'Start Date (YYYY-MM-DD)')}
                  placeholder="2026-06-01"
                  keyboardType="numbers-and-punctuation"
                  value={assignStartDate}
                  onChangeText={setAssignStartDate}
                />

                <View className="mt-4 gap-3">
                  <PrimaryButton
                    title={saving ? t('common.saving', 'Assigning...') : t('coach.plans.assignBtn', 'Assign')}
                    loading={saving}
                    onPress={() => {
                      if (!assignClientId) return;
                      handleAssign(assignClientId, assignStartDate);
                    }}
                  />
                  <SecondaryButton
                    title={t('common.cancel', 'Cancel')}
                    onPress={() => setAssignPlanTarget(null)}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
