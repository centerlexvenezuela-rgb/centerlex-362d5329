import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";

const Terms = () => {
  const { branding } = useBranding();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1 className="font-serif text-base sm:text-lg">{branding.app_title}</h1>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1.5" /> Volver</Link>
          </Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="prose prose-slate max-w-none">
          <h1 className="font-serif text-3xl sm:text-4xl mb-2">Términos y Condiciones de Uso de CenterLex</h1>
          <p className="text-sm text-muted-foreground mb-8">Última actualización: 15 de Julio del 2026.</p>

          <p>Bienvenido a CenterLex (<a href="https://centerlex.lovable.app/" className="text-accent underline">https://centerlex.lovable.app/</a>), una aplicación de gestión jurídica diseñada para optimizar el trabajo de los profesionales del derecho. Lea atentamente los siguientes Términos y Condiciones, ya que regulan el acceso y uso de nuestra plataforma. Al registrarse y utilizar CenterLex, usted acepta quedar vinculado por estos términos en su totalidad. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la aplicación.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">1. Aceptación y Modificación de los Términos</h2>
          <p>Al crear una cuenta y utilizar CenterLex, usted declara que ha leído, comprendido y aceptado estos Términos y Condiciones. CenterLex se reserva el derecho de modificar o actualizar estos términos en cualquier momento. Las modificaciones serán efectivas inmediatamente después de su publicación en la plataforma. Le recomendamos revisar periódicamente esta sección para mantenerse informado de cualquier cambio.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">2. Registro, Cuentas de Prueba y Contratación</h2>
          <h3 className="font-serif text-xl mt-4 mb-2">2.1. Creación de Cuenta</h3>
          <p>Para acceder a las funcionalidades de CenterLex, los usuarios deben registrarse proporcionando información veraz y completa. Cada usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">2.2. Cuenta de Prueba Gratuita</h3>
          <p>CenterLex ofrece un método de prueba gratuito del sistema. Este permite la creación de una cuenta de prueba por un período de 7 días continuos. Durante este tiempo, el usuario podrá acceder a todas las funcionalidades de la aplicación con el único fin de evaluar su idoneidad para sus necesidades profesionales.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">2.3. Fin del Período de Prueba</h3>
          <p>Culminado el período de prueba de 7 días, la cuenta de prueba se inhabilitará automáticamente. El usuario recibirá una notificación en su correo electrónico registrado para informarle sobre esta inhabilitación y se le invitará a tomar la decisión de contratar el servicio completo de CenterLex para continuar utilizando la plataforma.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">2.4. Eliminación de Cuentas Inhabilitadas</h3>
          <p><strong>Cuentas de prueba inhabilitadas:</strong> CenterLex esperará un lapso de 15 días continuos a partir de la fecha de inhabilitación antes de proceder a la eliminación permanente de la cuenta y el borrado total de todos los datos asociados a la misma. Durante este período, no se podrá acceder a la cuenta, pero los datos serán recuperables si el usuario decide contratar el servicio antes de que finalice el plazo.</p>
          <p><strong>Cuentas de usuarios que abandonan la aplicación:</strong> Si un usuario registrado (con plan de pago) decide abandonar la aplicación y no renueva su suscripción, dispondrá de un plazo de 15 días a partir de la fecha de finalización del servicio para solicitar la exportación de su información. Transcurrido este período sin que el usuario haya manifestado su intención de continuar, CenterLex procederá a la eliminación completa de la cuenta y todos sus datos.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">3. Confidencialidad y Acceso a los Datos de los Usuarios</h2>
          <p>CenterLex se compromete a mantener la más estricta confidencialidad sobre todos los datos de sus usuarios registrados.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">3.1. No Compartición de Datos Generales</h3>
          <p>CenterLex no compartirá ninguna información de los usuarios a terceros, salvo que medie una orden judicial firme y vinculante que obligue al sitio web a presentar dicha información ante un juez competente. Cualquier otra solicitud de información será rechazada en virtud de este compromiso de confidencialidad.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">3.2. Confidencialidad de los Datos de los Clientes</h3>
          <p>Toda la información perteneciente a los clientes de cada usuario registrado es absolutamente confidencial. CenterLex garantiza que ningún otro abogado, ni el administrador de la plataforma, podrá ver o tener acceso a dicha información bajo ninguna circunstancia, a menos que el propio usuario titular de la cuenta así lo autorice expresamente.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">4. Almacenamiento de Documentos y Acceso a Google Drive</h2>
          <h3 className="font-serif text-xl mt-4 mb-2">4.1. Sistema de Almacenamiento</h3>
          <p>Para garantizar un mayor nivel de confidencialidad y seguridad, CenterLex no guarda copia alguna de los documentos o archivos PDF que los usuarios gestionan a través de la aplicación. Todos los documentos se almacenan exclusivamente en el espacio de Google Drive de cada usuario registrado.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">4.2. Autorización y Permisos de Google Drive</h3>
          <p>El usuario otorga a CenterLex la autorización de lectura y escritura a su cuenta de Google Drive, la cual es indispensable para el correcto funcionamiento de la aplicación y la gestión de documentos.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">4.3. Alcance del Acceso a Google Drive</h3>
          <p>La aplicación gestiona la edición, el guardado o el borrado de la información exclusivamente dentro de la carpeta denominada "Lex Office" en su cuenta de Google Drive. CenterLex garantiza que sus administradores no podrán ver ni tener acceso a la carpeta "Lex Office" de ningún usuario, ni a ningún otro directorio de su cuenta de Google Drive. Los permisos concedidos se limitan estrictamente a las operaciones necesarias para la prestación del servicio y en ningún caso se utilizan para acceder a información personal del usuario fuera del contexto de la aplicación.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">5. Propiedad de los Datos y Retención</h2>
          <h3 className="font-serif text-xl mt-4 mb-2">5.1. Titularidad de los Datos</h3>
          <p>El usuario es el único propietario de todos los datos personales y profesionales que introduzca en la plataforma, así como de los documentos almacenados en su Google Drive.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">5.2. Principio de No Retención de Datos</h3>
          <p>En ningún caso CenterLex conservará datos de los usuarios o de sus clientes en su base de datos más allá del período de la relación contractual. Si la cuenta en CenterLex desaparece (ya sea por inhabilitación, finalización del período de prueba, o eliminación voluntaria), todos los datos asociados a la misma serán eliminados permanentemente de los sistemas de CenterLex.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">5.3. Excepción: Documentos de Google Drive</h3>
          <p>Como excepción al punto anterior, los documentos almacenados en la carpeta "Lex Office" de Google Drive permanecerán protegidos en la cuenta personal del usuario, ya que CenterLex no los aloja internamente. No obstante, la aplicación perderá toda capacidad de gestionarlos una vez que la cuenta de CenterLex sea eliminada.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">6. Responsabilidades y Exenciones de Responsabilidad</h2>
          <h3 className="font-serif text-xl mt-4 mb-2">6.1. Contenido de los Documentos</h3>
          <p>CenterLex no se hace responsable por el contenido, veracidad, legalidad o integridad de los documentos generados o gestionados por los usuarios registrados. La aplicación, por configuraciones técnicas y acuerdos de confidencialidad, no tiene acceso al contenido de dichos documentos. La responsabilidad sobre el contenido de los mismos recae íntegramente en el usuario.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">6.2. Gestión y Actuación Profesional</h3>
          <p>CenterLex no se hace responsable por las gestiones, actuaciones profesionales, consejos o decisiones que los usuarios registrados tomen en el ejercicio de su profesión utilizando la herramienta. La aplicación es una herramienta de apoyo y no sustituye el criterio profesional del abogado. No existe ninguna relación laboral, de agencia, sociedad o franquicia entre los usuarios y CenterLex. El usuario actúa bajo su propia y exclusiva responsabilidad.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">6.3. Uso de Google Drive</h3>
          <p>El usuario es el único responsable de mantener la seguridad de su cuenta de Google Drive. CenterLex no se hace responsable por pérdidas, filtraciones o daños derivados de accesos no autorizados a la cuenta de Google Drive del usuario que sean consecuencia de una negligencia o fallo de seguridad imputable al usuario.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">7. Colaboración con las Autoridades</h2>
          <p>En los casos en que CenterLex tenga sospechas fundadas o tenga conocimiento directo de la comisión de un fraude, actividad ilegal o situación irregular en la que un usuario registrado esté incurso, CenterLex colaborará con las autoridades competentes de acuerdo con la legalidad vigente y los procedimientos judiciales establecidos, pudiendo proporcionar la información estrictamente necesaria que obre en su poder para la investigación.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">8. Política de Precios y Pagos</h2>
          <h3 className="font-serif text-xl mt-4 mb-2">8.1. Fijación de Precios</h3>
          <p>CenterLex fijará los costos de sus servicios de acuerdo con sus propios análisis de mercado, rentabilidad y costes operativos. Los precios serán publicados de forma clara y visible en la plataforma y podrán ser modificados por CenterLex, notificando a los usuarios con la antelación debida.</p>
          <h3 className="font-serif text-xl mt-4 mb-2">8.2. Servicio de Uso Inmediato y No Reembolsable</h3>
          <p>Dado que CenterLex ofrece un servicio virtual de uso inmediato, una vez que el usuario ha contratado un plan de pago y ha accedido a las funcionalidades, la aplicación no tiene políticas de devoluciones ni de reembolso del dinero. El usuario es consciente de esta condición antes de formalizar cualquier pago, por lo que se recomienda evaluar exhaustivamente el servicio durante el período de prueba gratuito.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">9. Limitación de Responsabilidad</h2>
          <p>En la máxima medida permitida por la ley, CenterLex, sus directivos, empleados y proveedores no serán responsables ante el usuario o cualquier tercero por daños directos, indirectos, incidentales, especiales, consecuentes o punitivos que surjan del uso o la imposibilidad de usar la plataforma, incluso si se ha informado de la posibilidad de dichos daños.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">10. Ley Aplicable y Jurisdicción</h2>
          <p>Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes de la República de Venezuela. Cualquier disputa que surja en relación con estos términos o el uso de la plataforma estará sujeta a la jurisdicción exclusiva de los tribunales competentes de la ciudad de [Ciudad de registro de la empresa], Venezuela.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">11. Disposiciones Generales</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Acuerdo Completo:</strong> Estos Términos y Condiciones constituyen el acuerdo completo entre el usuario y CenterLex en relación con el uso de la aplicación, y reemplazan cualquier acuerdo o entendimiento previo.</li>
            <li><strong>Nulidad:</strong> Si alguna disposición de estos términos es considerada inválida o inaplicable por un tribunal competente, las disposiciones restantes permanecerán en pleno vigor y efecto.</li>
            <li><strong>Renuncia:</strong> La falta de ejercicio por parte de CenterLex de cualquier derecho o disposición de estos términos no constituirá una renuncia a dicho derecho o disposición.</li>
          </ul>

          <p className="mt-8 font-medium">Al utilizar CenterLex, usted reconoce haber leído y aceptado estos Términos y Condiciones en su totalidad.</p>
          <p className="text-sm text-muted-foreground mt-4">CenterLex – Gestión Jurídica Inteligente</p>
        </article>
      </main>
      <footer className="border-t bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {branding.app_title}
        </div>
      </footer>
    </div>
  );
};

export default Terms;
