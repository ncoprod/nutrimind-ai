import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../App';
import type { Activity } from '../types';

interface ActivitiesPageProps {
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}

const ActivitiesPage: React.FC<ActivitiesPageProps> = ({ activities, setActivities }) => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'running',
    duration: '30',
    caloriesBurned: '200',
    notes: '',
  });

  const activityTypes = [
    { id: 'running', icon: 'solar:running-bold-duotone', color: 'text-red-500' },
    { id: 'cycling', icon: 'solar:bicycling-bold-duotone', color: 'text-blue-500' },
    { id: 'walking', icon: 'solar:walking-bold-duotone', color: 'text-green-500' },
    { id: 'gym', icon: 'solar:dumbbells-bold-duotone', color: 'text-purple-500' },
    { id: 'swimming', icon: 'solar:swimming-bold-duotone', color: 'text-cyan-500' },
    { id: 'yoga', icon: 'solar:meditation-bold-duotone', color: 'text-pink-500' },
    { id: 'other', icon: 'solar:star-bold-duotone', color: 'text-orange-500' },
  ];

  const getActivityIcon = (type: string) => {
    const activity = activityTypes.find(a => a.id === type);
    return activity || activityTypes[activityTypes.length - 1];
  };

  const todayActivities = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activities.filter(a => a.date === today);
  }, [activities]);

  const totalTodayCalories = useMemo(() => {
    return todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  }, [todayActivities]);

  const totalTodayMinutes = useMemo(() => {
    return todayActivities.reduce((sum, a) => sum + a.duration, 0);
  }, [todayActivities]);

  const handleOpenModal = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        date: activity.date,
        type: activity.type,
        duration: activity.duration.toString(),
        caloriesBurned: activity.caloriesBurned.toString(),
        notes: activity.notes || '',
      });
    } else {
      setEditingActivity(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'running',
        duration: '',
        caloriesBurned: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActivity(null);
  };

  const handleSave = () => {
    const duration = Math.max(1, parseInt(formData.duration || '0'));
    const caloriesBurned = Math.max(1, parseInt(formData.caloriesBurned || '0'));

    if (editingActivity) {
      setActivities(prev => 
        prev.map(a => 
          a.id === editingActivity.id 
            ? { ...editingActivity, ...formData, duration, caloriesBurned }
            : a
        )
      );
    } else {
      const newActivity: Activity = {
        id: Date.now().toString(),
        date: formData.date,
        type: formData.type,
        duration,
        caloriesBurned,
        notes: formData.notes,
      };
      setActivities(prev => [...prev, newActivity]);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('activities.delete') + ' ?')) {
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return parseInt(b.id) - parseInt(a.id);
    });
  }, [activities]);

  return (
    <div>
      <div className="bg-gradient-to-br from-primary to-[#FF7A62] p-6 lg:rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading text-white">{t('activities.title')}</h1>
            <p className="text-white/90 text-sm mt-1">{t('activities.subtitle')}</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Icon icon="solar:add-circle-bold-duotone" className="size-5" />
            {t('activities.addActivity')}
          </button>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-6 lg:-mt-12 max-w-6xl mx-auto">
        {/* Stats du jour */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border shadow-lg p-5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon icon="solar:fire-bold-duotone" className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('activities.totalToday')}</p>
                <p className="text-2xl font-bold text-foreground">{totalTodayCalories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-lg p-5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Icon icon="solar:clock-circle-bold-duotone" className="size-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('activities.duration')}</p>
                <p className="text-2xl font-bold text-foreground">{totalTodayMinutes}</p>
                <p className="text-xs text-muted-foreground">{t('activities.minutes')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-lg p-5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Icon icon="solar:check-circle-bold-duotone" className="size-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activités</p>
                <p className="text-2xl font-bold text-foreground">{todayActivities.length}</p>
                <p className="text-xs text-muted-foreground">aujourd'hui</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des activités */}
        <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
          <h2 className="text-xl font-bold font-heading mb-4">Historique</h2>

          {sortedActivities.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:running-round-bold-duotone" className="size-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('activities.empty')}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t('activities.empty.description')}</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('activities.addActivity')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedActivities.map((activity) => {
                const activityInfo = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className={`size-12 rounded-xl bg-white flex items-center justify-center ${activityInfo.color}`}>
                      <Icon icon={activityInfo.icon} className="size-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {t(`activities.types.${activity.type}`)}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:clock-circle-bold-duotone" className="size-4" />
                          {activity.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:fire-bold-duotone" className="size-4" />
                          {activity.caloriesBurned} kcal
                        </span>
                      </div>
                      {activity.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{activity.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(activity)}
                        className="size-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                      >
                        <Icon icon="solar:pen-bold-duotone" className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="size-9 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors"
                      >
                        <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold font-heading text-foreground mb-4">
              {editingActivity ? (t('activities.addActivity') + ' ✏️') : t('activities.addActivity')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('activities.type')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {activityTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        formData.type === type.id
                          ? 'bg-primary text-primary-foreground scale-105'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon icon={type.icon} className="size-6" />
                      <span className="text-xs font-medium truncate w-full text-center">
                        {t(`activities.types.${type.id}`).split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('activities.duration')} (min)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="30"
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={formData.caloriesBurned}
                    onChange={(e) => setFormData(prev => ({ ...prev, caloriesBurned: e.target.value }))}
                    placeholder="200"
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('activities.notes')} ({t('common.optional')})
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:ring-primary focus:border-primary"
                  placeholder="Détails de l'activité..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
              >
                {t('activities.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('activities.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
