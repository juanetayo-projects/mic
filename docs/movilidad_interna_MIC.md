Build: Aplicacion para Gestion de solicitud de Transporte Interno -MIC-

Se requiere construir una app que permita

	.- Construye el proyecto a partir de la ruta de mi pc C:\Users\Juan Carlos Etayo\movilidad_interna
	En la ruta: C:\Users\Juan Carlos Etayo\movilidad_interna\images se encuentran los logos de la Clinica
	.- El color azul debe utilizar este:#0D2D6B y con constrastes de este azul #16468E
	

1.- Infraestructura
	Github (ya cuento con MCP para todo el despliegue)
		El nombre del repositorio deber ser: cambiodeturnos
	Supabase (ya cuento con MCP para todo el despliegue)
		El nombre del repositorio deber ser: cambiodeturnos
	Resend (ya cuento con MCP para todo el despliegue)
		La API Key deben llamarse notificacionturnos
	Excel
		Solicitud servicios MIC.xlsx
		requiero que analises estos datos para que desde aqui inciemos el desarrollo
		
	
2.- La palicacion debe tener las siguientes condiciones
		Debe contar con un acceso a traves de credenciales basadas en correo electronico y contraseña
		Los usuarios que no tenga credenciales deben tener la opcion de crear su propio usuario y contraseña basado en la estructura del punto anterior
		La habilitacion del usuario debe hacer desde el link que se le vnie al correo electronico
		Utiliza el modelo el login de acuerdo al proyecto de "cambiodeturno"

		El usuario al ingresar tendra la posibilidad en primer lugar de ver todas sus solicitudes previas, con su estado de gestion (solicitada, aprobada, rechazada, ect)
		Cada solicitud debe contar con un codigo de solicitud
		
		Al Coordinador o encargado de autorizar las solicitudes igualmente se le debe notificar a traves de correo electronico
		El coordinador debera revisar las solicitudes y gestionarlas, aprobadolas, aplazarlas, o rechazarla
		Por cada estado de estos tambien se deben generar notificaciones al solicitante
		
		La aplicacion debera cargar el histrocio desde el archivo de Excel que ha servido de base a este analisis		
		La app debe contar con todos los filtros posibles para consultar los  registros
		La app debe contar con las crads metrics posibles, deben contar con colores segun el tipo de datos, estas deben tener sombras y relieves para destacar la informacion
		La app debe contar con graficos y estadisticas, las tablas deben tener sombras y relieves en los bordes, color diferente en las filas impares
		La app debe contar con las opciones tipo "CRUD" para la gestion de los registros por parte del perfil de coordinador
		La app debe crear tablas para los campos que sea tipo lista desplegable
		Una vez realice la solicitud se le debe notificar a su correo indicandole que acaba de realizar una solicitud para que le quede como evidencia con su respectivo ID en formato profesional de HTML
		Una vez el coordinador apruebe o niegue la solicitud, pesta debe ser notificada al usuario solicitante informandole del estado con su respectivo comentario.
		La app debe ser desplegada desde el momento inicial en Github
		La app debera crear un usuario administrador asi: usuario: juan.etayo@cacsantabarbara.co contraseña: admin123* nombres: Juan Carlos Etayo, rol: administrador
		
3.- Diligenciar a traves de un formulario por cada tipo de datos 
		El formulario debe contener: Los campos del archivo de Excel
		Se debe incluir un campo de observaciones
		El formulario de solicitud debe ser lo más profesional posible, que ocupe solo una pantalla sin que tengan que hacer scroll vertical
		
	
4.- Los datos deben quedar registrada en una tabla de la base de datos de Supabase (recuerda ya cuento con MCP de Supabase)
		La app debe mostrar los datos en una tabla de datos con modelo CRUD
		La app debe contener todos los filtros posibles
		Dashboard de metricas (tipo odoo.com)
		Filtros por año, mes, proceso/area, etc.
		Filtros todos los posibles
		Graficos, tablas con diseño tipo www.odoo.com

5.-  Utilizar el logo de la Clinica
		Utilizar colores relacionados con el logo
		Opcion de recuperacion de contraseña
		
6.- Reportes
	.- Todos los posibles
	.- Con opcion de exportar a Excel PDF
	.- Los archivos exportados deben contener titulos y logo de la Clínica
	

7.- La base de datos debe estar en Supabase

	Notas:
		Todas las tablas deben tener opcion (CRUD) para la gestion
		Se debe contemplar todas las opciones de permisos y accesos que requiera Supabase
		
8.- Resumen
		Se debe generar el super prompt basado en estas notas y todos los cambios que surgan del desarrollo
		Se debe contar con todo el codigo fuente de la aplicacion para futuros cambios o despligues en otro servidor e indicar la carpeta donde queda el codigo fuente
		Se deben generar todos los archivos .MD necesarios
		Se debe generar un informe de la estructura del proyecto
		Debes suministrar la ruta y nombre del archivo de este chat
	
9.- Antes de iniciar el proceso sugiero revises este prompt y has las sugerencias que consideres
