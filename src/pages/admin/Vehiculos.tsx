import { PageHeader } from '../../components/ui'
import CrudTable from '../../components/CrudTable'

export default function Vehiculos() {
  return (
    <div>
      <PageHeader titulo="Vehículos" subtitulo="Flota física: placas, documentación y vigencias" />
      <CrudTable tabla="vehiculos" titulo="Vehículo" orden="placas" anchoModal="max-w-2xl" campos={[
        { key: 'id', label: 'ID', soloLectura: true, ocultarEnTabla: true },
        { key: 'tipo_vehiculo_id', label: 'Tipo', tipo: 'select', optionsTable: 'tipos_vehiculo', optionLabel: 'nombre', requerido: true },
        { key: 'marca', label: 'Marca' },
        { key: 'modelo', label: 'Modelo' },
        { key: 'placas', label: 'Placas', requerido: true },
        { key: 'matricula', label: 'Matrícula' },
        { key: 'soat_vencimiento', label: 'SOAT vence', tipo: 'date' },
        { key: 'seguro_vencimiento', label: 'Seguro vence', tipo: 'date' },
        { key: 'tecnomecanica_vencimiento', label: 'Tecnomecánica vence', tipo: 'date' },
        {
          key: 'propiedad', label: 'Propiedad', tipo: 'select', requerido: true,
          opcionesFijas: [
            { value: 'geriater', label: 'Geriater' },
            { value: 'alquilado', label: 'Alquilado' },
          ],
        },
        { key: 'activo', label: 'Activo', tipo: 'boolean' },
      ]} />
    </div>
  )
}
