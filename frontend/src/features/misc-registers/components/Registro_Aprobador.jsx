import React from 'react';

export default function Aprobador() {
  const datos = [
    { id: 1, solicitante: 'Juan Pérez', motivo: 'Pedido de respuesto', estado: 'Pendiente' },
    { id: 2, solicitante: 'Ana López', motivo: 'Autorización de mantenimiento', estado: 'Aprobado' },
    { id: 3, solicitante: 'Carlos Díaz', motivo: 'Movimiento de stock', estado: 'Rechazado' },
  ];

  return (
    <div className="bg-white shadow-md rounded p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Solicitudes para Aprobar</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="text-xs uppercase bg-gray-100 text-gray-700">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Solicitante</th>
              <th className="px-6 py-3">Motivo</th>
              <th className="px-6 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila) => (
              <tr key={fila.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{fila.id}</td>
                <td className="px-6 py-4">{fila.solicitante}</td>
                <td className="px-6 py-4">{fila.motivo}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      fila.estado === 'Aprobado'
                        ? 'bg-green-100 text-green-700'
                        : fila.estado === 'Rechazado'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {fila.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
