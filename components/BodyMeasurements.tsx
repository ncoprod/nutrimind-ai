import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { BodyMeasurement } from '../types';

interface BodyMeasurementsProps {
  measurements: BodyMeasurement[];
  onUpdateMeasurements: (data: BodyMeasurement[]) => void;
}

const BodyMeasurements: React.FC<BodyMeasurementsProps> = ({ measurements, onUpdateMeasurements }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayData = measurements.find(m => m.date === today);
  
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState<Partial<BodyMeasurement>>(
    todayData || { date: today }
  );

  const handleSaveMeasurement = () => {
    if (!newMeasurement.date) return;
    
    const updatedMeasurements = measurements.filter(m => m.date !== newMeasurement.date);
    updatedMeasurements.push(newMeasurement as BodyMeasurement);
    updatedMeasurements.sort((a, b) => a.date.localeCompare(b.date));
    
    onUpdateMeasurements(updatedMeasurements);
    setIsAddingMeasurement(false);
  };

  const handleUpdateField = (field: keyof BodyMeasurement, value: number | undefined) => {
    setNewMeasurement(prev => ({ ...prev, [field]: value }));
  };

  // Calculer les variations
  const getProgress = (field: keyof BodyMeasurement) => {
    if (measurements.length < 2) return null;
    const sortedMeasurements = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
    const first = sortedMeasurements[0][field];
    const latest = sortedMeasurements[sortedMeasurements.length - 1][field];
    
    if (first && latest) {
      const diff = latest - first;
      return { diff, percentage: ((diff / first) * 100) };
    }
    return null;
  };

  const measurementFields = [
    { key: 'weight' as keyof BodyMeasurement, label: 'Poids', unit: 'kg', icon: 'solar:scale-bold-duotone', color: 'blue' },
    { key: 'waist' as keyof BodyMeasurement, label: 'Tour de taille', unit: 'cm', icon: 'solar:ruler-bold-duotone', color: 'purple' },
    { key: 'hips' as keyof BodyMeasurement, label: 'Tour de hanches', unit: 'cm', icon: 'solar:ruler-bold-duotone', color: 'pink' },
    { key: 'chest' as keyof BodyMeasurement, label: 'Tour de poitrine', unit: 'cm', icon: 'solar:ruler-bold-duotone', color: 'indigo' },
    { key: 'arms' as keyof BodyMeasurement, label: 'Tour de bras', unit: 'cm', icon: 'solar:arm-bold-duotone', color: 'green' },
    { key: 'thighs' as keyof BodyMeasurement, label: 'Tour de cuisses', unit: 'cm', icon: 'solar:ruler-bold-duotone', color: 'orange' },
    { key: 'bodyFat' as keyof BodyMeasurement, label: 'Taux de graisse', unit: '%', icon: 'solar:graph-bold-duotone', color: 'red' },
  ];

  const latestMeasurement = measurements.length > 0 
    ? [...measurements].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  return (
    <div className="bg-card rounded-3xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Icon icon="solar:body-bold-duotone" className="size-6 text-purple-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold font-heading">Mesures corporelles</h3>
            <p className="text-xs text-muted-foreground">
              {measurements.length > 0 
                ? `${measurements.length} mesure${measurements.length > 1 ? 's' : ''} enregistrée${measurements.length > 1 ? 's' : ''}`
                : 'Aucune mesure enregistrée'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setNewMeasurement(todayData || { date: today });
            setIsAddingMeasurement(true);
          }}
          className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1 hover:bg-primary/90 transition-colors active:scale-95"
        >
          <Icon icon="solar:add-circle-bold-duotone" className="size-5" />
          Ajouter
        </button>
      </div>

      {/* Modal d'ajout/édition */}
      {isAddingMeasurement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsAddingMeasurement(false)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-heading mb-4">Ajouter des mesures</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <input
                  type="date"
                  value={newMeasurement.date}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-border"
                  max={today}
                />
              </div>

              {measurementFields.map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Icon icon={field.icon} className={`size-5 text-${field.color}-500`} />
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={newMeasurement[field.key] || ''}
                      onChange={(e) => handleUpdateField(field.key, e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder={`Entrez ${field.label.toLowerCase()}`}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-border"
                    />
                    <span className="text-sm text-muted-foreground font-medium">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingMeasurement(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-muted text-foreground font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveMeasurement}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affichage des mesures récentes */}
      {latestMeasurement ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-2">
            Dernières mesures du {new Date(latestMeasurement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {measurementFields.map(field => {
              const value = latestMeasurement[field.key];
              const progress = getProgress(field.key);
              
              if (!value) return null;
              
              return (
                <div key={field.key} className={`p-3 rounded-xl bg-${field.color}-50 border border-${field.color}-100`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon={field.icon} className={`size-4 text-${field.color}-500`} />
                    <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{value}</span>
                    <span className="text-xs text-muted-foreground">{field.unit}</span>
                  </div>
                  {progress && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${progress.diff < 0 ? 'text-green-600' : progress.diff > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      <Icon 
                        icon={progress.diff < 0 ? 'solar:arrow-down-bold' : progress.diff > 0 ? 'solar:arrow-up-bold' : 'solar:minus-bold'} 
                        className="size-3" 
                      />
                      <span>{Math.abs(progress.diff).toFixed(1)} {field.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <Icon icon="solar:chart-2-bold-duotone" className="size-16 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune mesure enregistrée</p>
          <p className="text-xs text-muted-foreground mt-1">Commencez à suivre vos progrès</p>
        </div>
      )}

      {/* Historique rapide */}
      {measurements.length > 1 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">HISTORIQUE</span>
            <span className="text-xs text-muted-foreground">{measurements.length} entrées</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {[...measurements]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((measurement, idx) => (
                <div key={measurement.date} className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground">
                    {new Date(measurement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center gap-3">
                    {measurement.weight && (
                      <span className="font-medium">{measurement.weight} kg</span>
                    )}
                    {measurement.waist && (
                      <span className="text-muted-foreground">{measurement.waist} cm</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyMeasurements;

