import { PageHeader } from '../../components/ui'
import CrudTable from '../../components/CrudTable'

export default function Areas() {
  return (
    <div>
      <PageHeader titulo="Áreas / Procesos" subtitulo="Catálogo de áreas que solicitan transporte" />
      <CrudTable tabla="areas" titulo="Área" orden="nombre" campos={[
        { key: 'id', label: 'ID', soloLectura: true, ocultarEnTabla: true },
        { key: 'nombre', label: 'Nombre', requerido: true },
        { key: 'activo', label: 'Activo', tipo: 'boolean' },
      ]} />
    </div>
  )
}
