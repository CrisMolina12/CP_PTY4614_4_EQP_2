'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import supabase from "../../../lib/supabaseClient"
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, DollarSign, FileText, User, Check, X, Bell, Menu, LogOut } from 'lucide-react'

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-8 rounded-2xl"
    >
      <div className="flex items-center space-x-4">
        <Image
          src="/Imagen1.png" 
          alt="Logo de Angeles"
          width={50}
          height={50}
          className="rounded-full border-2 border-white shadow-md"
        />
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold tracking-wide"
        >
          Angeles
        </motion.span>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-white hover:text-gray-200 transition-colors">
          <Bell size={24} />
        </button>
        <button className="text-white hover:text-gray-200 transition-colors">
          <Menu size={24} />
        </button>
        <button className="text-white hover:text-gray-200 transition-colors">
          <LogOut size={24} />
        </button>
      </div>
    </motion.header>
  )
}

type FormData = {
  rut: string
  precio: string
  fechaServicio: string
  horaInicio: string
  horaFin: string
  descripcion: string
}

export default function RegistrarVenta() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rutsClientes, setRutsClientes] = useState<string[]>([])
  const [rutsFiltrados, setRutsFiltrados] = useState<string[]>([])
  const [idTrabajador, setIdTrabajador] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    rut: '',
    precio: '',
    fechaServicio: '',
    horaInicio: '',
    horaFin: '',
    descripcion: ''
  })
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null)

  useEffect(() => {
    const initializeComponent = async () => {
      await verificarSesion()
      await obtenerRutsClientes()
      setLoading(false)
    }

    initializeComponent()
  }, [router])

  const verificarSesion = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      const { data: workerData, error: workerError } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (workerError || !workerData) {
        console.error('Error al obtener el ID del trabajador:', workerError)
        setMensaje({ tipo: 'error', texto: 'No se puede determinar el ID del trabajador.' })
        return
      }

      setIdTrabajador(workerData.id)
    }
  }

  const obtenerRutsClientes = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('rut')
      if (error) throw error
      if (data) {
        setRutsClientes(data.map((cliente) => cliente.rut))
      }
    } catch (error) {
      console.error('Error al obtener los RUTs de los clientes:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'rut') {
      setRutsFiltrados(value ? rutsClientes.filter(rut => rut.startsWith(value)) : [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (idTrabajador === null) {
      setMensaje({ tipo: 'error', texto: 'No se puede registrar la venta sin un trabajador autenticado.' })
      return
    }

    if (!rutsClientes.includes(formData.rut)) {
      setMensaje({ tipo: 'error', texto: 'El RUT ingresado no está registrado. Por favor, registre al cliente.' })
      return
    }

    try {
      const { data: datosVenta, error: errorVenta } = await supabase.from('ventas').insert({
        client_id: formData.rut,
        worker_id_integer: idTrabajador,
        price: parseFloat(formData.precio),
        description: formData.descripcion,
      }).select('*').single()

      if (errorVenta) throw errorVenta

      if (datosVenta && typeof datosVenta.id === 'number') {
        const { error: errorCita } = await supabase.from('citas').insert({
          venta_id: datosVenta.id,
          service_date: formData.fechaServicio,
          start_time: formData.horaInicio,
          end_time: formData.horaFin,
          description: formData.descripcion,
        })

        if (errorCita) throw errorCita

        setMensaje({ tipo: 'exito', texto: '¡La cita ha sido agendada con éxito!' })
        setTimeout(() => router.push('/ventas'), 3000)
      } else {
        throw new Error('ID de venta no válido')
      }
    } catch (error) {
      console.error('Error al registrar la venta y la cita:', error)
      setMensaje({ tipo: 'error', texto: 'Ocurrió un error al registrar la venta y la cita.' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="px-6 py-8 sm:p-10">
            <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-900">Agendar Nueva Cita</h2>
            <AnimatePresence>
              {mensaje && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-6 p-4 rounded-lg ${
                    mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div className="flex items-center">
                    {mensaje.tipo === 'exito' ? (
                      <Check className="w-5 h-5 mr-2" />
                    ) : (
                      <X className="w-5 h-5 mr-2" />
                    )}
                    <p className="font-medium">{mensaje.texto}</p>
                  </div>
                  {mensaje.tipo === 'error' && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-2 text-indigo-600 hover:text-indigo-800 transition duration-300 underline"
                      onClick={() => router.push('/cliente')}
                    >
                      Registrar nuevo cliente
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">RUT del cliente</label>
                <div className="relative">
                  <User className="absolute top-3 left-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    id="rut"
                    name="rut"
                    value={formData.rut}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                    placeholder="Ingrese RUT del cliente"
                  />
                </div>
                <AnimatePresence>
                  {rutsFiltrados.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto"
                    >
                      <ul>
                        {rutsFiltrados.map((rutFiltrado) => (
                          <motion.li 
                            key={rutFiltrado}
                            whileHover={{ backgroundColor: "#F3F4F6" }}
                            className="px-4 py-2 cursor-pointer transition duration-150 ease-in-out"
                            onClick={() => setFormData(prev => ({ ...prev, rut: rutFiltrado }))}
                          >
                            {rutFiltrado}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <div className="relative">
                  <DollarSign className="absolute top-3 left-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                    placeholder="Ingrese el precio"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="fechaServicio" className="block text-sm font-medium text-gray-700 mb-1">Fecha del servicio</label>
                <div className="relative">
                  <Calendar className="absolute top-3 left-3 text-gray-400" size={20} />
                  <input
                    type="date"
                    id="fechaServicio"
                    name="fechaServicio"
                    value={formData.fechaServicio}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio</label>
                  <div className="relative">
                    <Clock className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      type="time"
                      id="horaInicio"
                      name="horaInicio"
                      value={formData.horaInicio}
                      onChange={handleInputChange}
                      required
                      className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 mb-1">Hora de fin</label>
                  <div className="relative">
                    <Clock className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      type="time"
                      id="horaFin"
                      name="horaFin"
                      value={formData.horaFin}
                      onChange={handleInputChange}
                      required
                      className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <div className="relative">
                  <FileText className="absolute top-3 left-3 text-gray-400" size={20} />
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                    rows={4}
                    placeholder="Ingrese una descripción del servicio"
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition duration-300 ease-in-out font-medium text-lg"
              >
                Registrar Venta
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}