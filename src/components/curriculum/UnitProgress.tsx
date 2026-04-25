"use client";

export default function UnitProgress() {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-on-surface mb-4">Cobertura General</h3>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-[10px] font-bold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary-container">
              En Progreso
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold inline-block text-secondary">
              64%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-surface-container">
          <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary" style={{ width: "64%" }}></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase">Unidades Completadas</p>
          <p className="text-2xl font-bold text-on-surface">3/5</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase">Temas Impartidos</p>
          <p className="text-2xl font-bold text-on-surface">28/42</p>
        </div>
      </div>
    </div>
  );
}
