import { PageHeader } from '../../components/ui'
import CrudTable from '../../components/CrudTable'

export default function TiposVehiculo() {
  return (
    <div>
      <PageHeader titulo="Tipos de vehículo" subtitulo="Catálogo de vehículos disponibles" />
      <CrudTable tabla="tipos_vehiculo" titulo="Tipo de vehículo" orden="nombre" campos={[
        { key: 'id', label: 'ID', soloLectura: true, ocultarEnTabla: true },
        { key: 'nombre', label: 'Nombre', requerido: true },
        { key: 'activo', label: 'Activo', tipo: 'boolean' },
      ]} />
    </div>
  )
}
