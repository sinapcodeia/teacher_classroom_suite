"use client";

import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function UnitProgress() {
  const { curriculum } = useApp();

  const activeCurriculum = useMemo(() => curriculum[0], [curriculum]);

  const stats = useMemo(() => {
    if (!activeCurriculum) return { percentage: 0, unitsDone: 0, totalUnits: 0, topicsDone: 0, totalTopics: 0 };

    const totalTopics = activeCurriculum.units.reduce((acc, u) => acc + u.topics.length, 0);
    const topicsDone = activeCurriculum.units.reduce((acc, u) => 
      acc + u.topics.filter(t => t.status === "covered").length, 0
    );
    
    const percentage = totalTopics > 0 ? Math.round((topicsDone / totalTopics) * 100) : 0;
    const totalUnits = activeCurriculum.units.length;
    const unitsDone = activeCurriculum.units.filter(u => 
      u.topics.length > 0 && u.topics.every(t => t.status === "covered")
    ).length;

    return { percentage, unitsDone, totalUnits, topicsDone, totalTopics };
  }, [activeCurriculum]);

  if (!activeCurriculum) return null;

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-on-surface mb-4">Cobertura General</h3>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-[10px] font-bold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary-container">
              {stats.percentage === 100 ? "Completado" : "En Progreso"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold inline-block text-secondary">
              {stats.percentage}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-surface-container">
          <div 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary transition-all duration-1000" 
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Unidades Completadas</p>
          <p className="text-2xl font-bold text-on-surface">{stats.unitsDone}/{stats.totalUnits}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Temas Impartidos</p>
          <p className="text-2xl font-bold text-on-surface">{stats.topicsDone}/{stats.totalTopics}</p>
        </div>
      </div>
    </div>
  );
}
