import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/config';
import { Users, Package, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardHome() {
  const [data, setData] = useState({
    totalUsers: 0,
    activeMachines: 0,
    totalStock: 0,
    latestEntries: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          usersRes,
          machinesRes,
          stockRes,
          entriesRes
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/total-usuarios`),
          fetch(`${API_BASE_URL}/dashboard/maquinas-activas`),
          fetch(`${API_BASE_URL}/dashboard/total-stock`),
          fetch(`${API_BASE_URL}/dashboard/ultimas-entradas`)
        ]);

        const usersData = await usersRes.json();
        const machinesData = await machinesRes.json();
        const stockData = await stockRes.json();
        const entriesData = await entriesRes.json();

        if (!usersRes.ok) throw new Error(usersData.error || 'Error al cargar usuarios');
        if (!machinesRes.ok) throw new Error(machinesData.error || 'Error al cargar máquinas');
        if (!stockRes.ok) throw new Error(stockData.error || 'Error al cargar stock');
        if (!entriesRes.ok) throw new Error(entriesData.error || 'Error al cargar entradas');

        setData({
          totalUsers: usersData.count,
          activeMachines: machinesData.count,
          totalStock: stockData.totalStock,
          latestEntries: entriesData,
        });

      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
        setError(`❌ Error al cargar datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">¡Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Resumen del Dashboard</h1>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Tarjeta de Total Usuarios */}
        <div
          className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/registro/lista-usuarios')} // ✅ Redirige a la lista de usuarios
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
            <p className="text-3xl font-semibold text-gray-900">{data.totalUsers}</p>
          </div>
          <Users size={48} className="text-blue-500 opacity-75" />
        </div>

        {/* Tarjeta de Máquinas Activas */}
        <div
          className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/registro/lista-maquinas')} // ✅ Redirige a la lista de máquinas
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Máquinas Activas</p>
            <p className="text-3xl font-semibold text-gray-900">{data.activeMachines}</p>
          </div>
          <Activity size={48} className="text-green-500 opacity-75" />
        </div>

        {/* Tarjeta de Stock Total (Productos) */}
        <div
          className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/registro/lista-productos')} // ✅ Redirige a la lista de productos
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Stock Total (Productos)</p>
            <p className="text-3xl font-semibold text-gray-900">{data.totalStock} kg</p>
          </div>
          <Package size={48} className="text-yellow-500 opacity-75" />
        </div>

        {/* Tarjeta de Últimas Entradas */}
        <div
          className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/registro/lista-entradas')} // ✅ Redirige a la lista de entradas
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Últimas Entradas</p>
            <p className="text-3xl font-semibold text-gray-900">{data.latestEntries.length}</p>
          </div>
          <TrendingUp size={48} className="text-purple-500 opacity-75" />
        </div>
      </div>

      {/* Tabla de Últimas 5 Entradas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Últimas 5 Entradas</h2>
        {data.latestEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corte/Operación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.latestEntries.map((entry) => (
                  <tr key={entry.EntNumero}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.EntNumero}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.Fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.NroCorte}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.Estado}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.UsuNombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay entradas recientes para mostrar.</p>
        )}
      </div>
    </div>
  );
}
