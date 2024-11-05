'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import supabase from '../../../lib/supabaseClient'

function Header() {
  return (
    <header className="bg-purple-600 p-4 rounded-2xl shadow-lg mb-8 mx-auto max-w-7xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-full p-1">
            <Image
              src="/Imagen1.png" 
              alt="Angeles Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Angeles</h1>
        </div>
        <button className="text-white">
          <Calendar size={24} />
        </button>
      </div>
    </header>
  )
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedWorker, setSelectedWorker] = useState<number | ''>('')
  const [ventas, setVentas] = useState<any[]>([])
  const [totalVentas, setTotalVentas] = useState<number>(0)
  const [totalComision, setTotalComision] = useState<number>(0)
  const [workers, setWorkers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [comisionPorcentaje, setComisionPorcentaje] = useState<number>(0)
  const [meses, setMeses] = useState<{ valor: string, nombre: string }[]>([])

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value)
  }

  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorker(parseInt(e.target.value, 10))
  }

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComisionPorcentaje(parseFloat(e.target.value))
  }

  const handleFilterChange = () => {
    obtenerVentas()
  }

  const obtenerVentas = async () => {
    try {
      setError(null)

      let ventasData: any[] = []
      let comisionTotal = 0

      if (selectedMonth) {
        const [año, mes] = selectedMonth.split('-')
        const inicioMes = new Date(`${año}-${mes}-01`).toISOString()
        const finMes = new Date(`${año}-${mes}-01`)
        finMes.setMonth(finMes.getMonth() + 1)
        const finMesISO = finMes.toISOString()

        const { data: citasData, error: errorCitas } = await supabase
          .from('citas')
          .select('venta_id')
          .gte('service_date', inicioMes)
          .lt('service_date', finMesISO)

        if (errorCitas) throw errorCitas

        const ventaIds = citasData.map(cita => cita.venta_id)
        const query = supabase
          .from('ventas')
          .select('id, price, worker_id_integer')
          .in('id', ventaIds)
        
        if (selectedWorker) {
          query.eq('worker_id_integer', selectedWorker)
        }

        const { data: ventasDataFetched, error: errorVentas } = await query

        if (errorVentas) throw errorVentas
        ventasData = ventasDataFetched ?? []

        comisionTotal = ventasData.reduce((total, venta) => {
          const comision = (venta.price * comisionPorcentaje) / 100
          return total + comision
        }, 0)
      }

      const precios = ventasData.map(venta => venta.price)
      setVentas(ventasData)
      const total = precios.reduce((acc, curr) => acc + curr, 0)
      setTotalVentas(total)
      setTotalComision(comisionTotal)
    } catch (error) {
      setError('Error al obtener las ventas: ' + (error as Error).message)
    }
  }

  const obtenerMesesConVentas = async () => {
    try {
      const { data: citasData, error: errorCitas } = await supabase
        .from('citas')
        .select('service_date')
        .order('service_date', { ascending: true })

      if (errorCitas) throw errorCitas

      const mesesConVentas = citasData.reduce((acc: { valor: string, nombre: string }[], cita: { service_date: string }) => {
        const fecha = new Date(cita.service_date)
        const mes = fecha.getMonth() + 1
        const año = fecha.getFullYear()
        const mesFormato = mes.toString().padStart(2, '0')
        const añoFormato = año.toString()
        const valor = `${añoFormato}-${mesFormato}`
        const mesNombre = fecha.toLocaleString('default', { month: 'long' }) + ' ' + añoFormato

        if (!acc.some(m => m.valor === valor)) {
          acc.push({ valor, nombre: mesNombre })
        }
        return acc
      }, [])

      setMeses(mesesConVentas)
    } catch (error) {
      setError('Error al obtener los meses con ventas: ' + (error as Error).message)
    }
  }

  useEffect(() => {
    const obtenerTrabajadores = async () => {
      try {
        const { data: workersData, error } = await supabase
          .from('users')
          .select('id, name')

        if (error) throw error
        setWorkers(workersData ?? [])
      } catch (error) {
        setError('Error al obtener los trabajadores: ' + (error as Error).message)
      }
    }

    obtenerTrabajadores()
    obtenerMesesConVentas()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      obtenerVentas()
    }
  }, [selectedMonth, selectedWorker, comisionPorcentaje])

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard de Ventas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccione un mes</option>
                {meses.map(mes => (
                  <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="worker" className="block text-sm font-medium text-gray-700 mb-1">
                Trabajador
              </label>
              <select
                id="worker"
                value={selectedWorker}
                onChange={handleWorkerChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccione un trabajador</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje de Comisión
              </label>
              <input
                id="percentage"
                type="number"
                value={comisionPorcentaje}
                onChange={handlePercentageChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                step="0.01"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300 ease-in-out"
              >
                Filtrar
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Ventas</h2>
              <p className="text-3xl font-bold text-purple-600">${totalVentas.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Comisión</h2>
              <p className="text-3xl font-bold text-green-600">${totalComision.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Número de Ventas</h2>
              <p className="text-3xl font-bold text-blue-600">{ventas.length}</p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <h2 className="text-xl font-semibold text-gray-800 p-4 bg-gray-50">Detalle de Ventas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID de Venta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ventas.map((venta) => (
                    <tr key={venta.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venta.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}