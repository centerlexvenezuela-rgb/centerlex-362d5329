import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";

const Privacy = () => {
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
          <h1 className="font-serif text-3xl sm:text-4xl mb-2">Política de Privacidad de CenterLex</h1>
          <p className="text-sm text-muted-foreground mb-8">Última actualización: 15 de julio del 2026.</p>

          <p>En CenterLex <a href="https://centerlex.lovable.app/" className="text-accent underline">https://centerlex.lovable.app/</a>, nos tomamos muy en serio la privacidad y seguridad de sus datos. Esta Política de Privacidad describe los tipos de información personal que recopilamos, cómo la utilizamos, con quién la compartimos y los derechos que usted tiene en relación con sus datos, en cumplimiento con los estándares internacionales de protección de datos, incluyendo el Reglamento General de Protección de Datos (GDPR) de la Unión Europea y la Ley de Privacidad del Consumidor de California (CCPA).</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">1. Responsable del Tratamiento y Delegado de Protección de Datos</h2>
          <p>CenterLex es el responsable del tratamiento de sus datos personales. Para cualquier consulta relacionada con esta política o sobre el ejercicio de sus derechos, puede contactarnos a través de:</p>
          <p>Correo electrónico: <a href="mailto:centerlexvenezuela@gmail.com" className="text-accent underline">centerlexvenezuela@gmail.com</a></p>
          <p>Si se requiere un Delegado de Protección de Datos (DPO) según la legislación aplicable, puede contactarlo a través de la misma dirección de correo electrónico, indicando "Atención: DPO".</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">2. Datos Personales que Recopilamos</h2>
          <p>CenterLex recopila y procesa diferentes categorías de datos personales para proporcionar sus servicios de gestión jurídica. Estas categorías incluyen:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Datos de identificación y contacto:</strong> Nombre y apellidos, dirección de correo electrónico, número de teléfono y dirección postal de los abogados, personal del bufete y clientes.</li>
            <li><strong>Datos de gestión de casos (expedientes):</strong> Información contenida en los expedientes jurídicos que usted gestione a través de la aplicación, que puede incluir datos de carácter personal de las partes involucradas, documentos legales, comunicaciones y cualquier otra información relevante para el caso.</li>
            <li><strong>Datos de la cuenta:</strong> Nombre de usuario, contraseña (almacenada de forma segura y encriptada) y preferencias de configuración dentro de la plataforma.</li>
            <li><strong>Datos de uso y técnicos:</strong> Información sobre cómo interactúa con la aplicación, como direcciones IP, tipo de navegador, páginas visitadas, tiempo de uso y otras estadísticas de rendimiento, recopilados a través de cookies y tecnologías similares para mejorar la experiencia del usuario.</li>
          </ul>

          <h2 className="font-serif text-2xl mt-8 mb-3">3. Base Legal para el Tratamiento de Datos</h2>
          <p>Procesamos sus datos personales basándonos en las siguientes bases legales, según lo exige el GDPR:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Ejecución de un contrato:</strong> Para gestionar su cuenta, proporcionarle los servicios de CenterLex y administrar los expedientes jurídicos que nos encomiende.</li>
            <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios, garantizar la seguridad de nuestra plataforma y prevenir fraudes.</li>
            <li><strong>Cumplimiento de una obligación legal:</strong> Para cumplir con las leyes y regulaciones aplicables que rigen la práctica legal y la retención de datos.</li>
            <li><strong>Consentimiento:</strong> Para enviarle comunicaciones de marketing o utilizar cookies no esenciales, cuando haya dado su consentimiento explícito, el cual puede retirar en cualquier momento.</li>
          </ul>

          <h2 className="font-serif text-2xl mt-8 mb-3">4. Cómo Utilizamos sus Datos</h2>
          <p>Los datos recopilados se utilizan para las siguientes finalidades:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Prestación del servicio:</strong> Crear y gestionar su cuenta, permitirle la gestión de casos, facilitar la colaboración entre miembros del bufete y almacenar de forma segura los documentos y datos de sus expedientes.</li>
            <li><strong>Mejora del servicio:</strong> Analizar el uso de la aplicación para identificar áreas de mejora, desarrollar nuevas funcionalidades y optimizar el rendimiento.</li>
            <li><strong>Comunicación:</strong> Enviarle notificaciones importantes sobre su cuenta, actualizaciones del servicio, cambios en esta política y, con su consentimiento, información sobre nuestros productos.</li>
            <li><strong>Seguridad y cumplimiento:</strong> Monitorear y proteger la integridad y seguridad de la plataforma, así como para cumplir con nuestras obligaciones legales y regulatorias.</li>
          </ul>

          <h2 className="font-serif text-2xl mt-8 mb-3">5. Divulgación y Transferencia de Datos a Terceros</h2>
          <p>CenterLex no vende ni alquila sus datos personales. Podemos compartir su información con:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Proveedores de servicios:</strong> Terceros de confianza que nos ayudan a operar la plataforma, como proveedores de alojamiento en la nube (por ejemplo, Lovable), servicios de análisis o de atención al cliente. Estos procesadores actúan bajo nuestras instrucciones y están sujetos a obligaciones contractuales estrictas para proteger sus datos.</li>
            <li><strong>Obligaciones legales:</strong> Cuando la ley nos lo exija o para responder a solicitudes válidas de autoridades judiciales, gubernamentales o regulatorias.</li>
            <li><strong>Transferencias internacionales:</strong> Dado que operamos en un entorno digital, sus datos pueden ser almacenados o procesados en servidores ubicados fuera de su país de residencia. En estos casos, garantizamos que dichas transferencias se realicen bajo mecanismos legales que aseguren un nivel de protección adecuado, como las Cláusulas Contractuales Estándar (SCCs) aprobadas por la Comisión Europea.</li>
          </ul>

          <h2 className="font-serif text-2xl mt-8 mb-3">6. Seguridad de los Datos</h2>
          <p>Hemos implementado medidas técnicas y organizativas apropiadas para proteger sus datos personales contra el acceso no autorizado, la alteración, la divulgación o la destrucción. Estas medidas incluyen el cifrado de datos en tránsito (mediante TLS) y en reposo, controles de acceso basados en roles y una monitorización continua de la plataforma para detectar vulnerabilidades.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">7. Retención de Datos</h2>
          <p>Conservaremos sus datos personales únicamente durante el tiempo necesario para cumplir con los propósitos para los que fueron recopilados, incluido el cumplimiento de obligaciones legales, contables o de informes. Los plazos de retención se determinan en función de la naturaleza de los datos y la finalidad del tratamiento. Una vez que los datos ya no sean necesarios, serán eliminados o anonimizados de forma segura.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">8. Sus Derechos de Protección de Datos</h2>
          <p>Usted tiene los siguientes derechos en relación con sus datos personales, que puede ejercer contactándonos a través del correo electrónico proporcionado:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Acceso:</strong> Tiene derecho a solicitar una copia de los datos personales que tenemos sobre usted.</li>
            <li><strong>Rectificación:</strong> Tiene derecho a solicitar la corrección de datos inexactos o incompletos.</li>
            <li><strong>Supresión ("Derecho al olvido"):</strong> Tiene derecho a solicitar la eliminación de sus datos personales, sujeto a ciertas excepciones legales.</li>
            <li><strong>Limitación del tratamiento:</strong> Tiene derecho a solicitar que restrinjamos el procesamiento de sus datos en determinadas circunstancias.</li>
            <li><strong>Portabilidad:</strong> Tiene derecho a recibir sus datos en un formato estructurado y de uso común y a transmitirlos a otro responsable.</li>
            <li><strong>Oposición:</strong> Tiene derecho a oponerse al procesamiento de sus datos basado en nuestro interés legítimo.</li>
            <li><strong>Retirada del consentimiento:</strong> Si el tratamiento se basa en su consentimiento, tiene derecho a retirarlo en cualquier momento.</li>
          </ul>
          <p>Atenderemos todas las solicitudes en el plazo legal establecido (generalmente 30 días). Es posible que necesitemos verificar su identidad antes de proceder con su solicitud.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">9. Cookies y Tecnologías Similares</h2>
          <p>Utilizamos cookies propias y de terceros para mejorar la funcionalidad de CenterLex y analizar el uso. Puede gestionar sus preferencias de cookies a través de la configuración de su navegador o del banner de consentimiento de cookies en nuestra plataforma.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">10. Cambios en esta Política de Privacidad</h2>
          <p>Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o por motivos legales. Le notificaremos cualquier cambio significativo mediante un aviso destacado en nuestra plataforma o por correo electrónico.</p>

          <h2 className="font-serif text-2xl mt-8 mb-3">11. Reclamaciones</h2>
          <p>Si no está satisfecho con nuestra respuesta a su solicitud, tiene derecho a presentar una reclamación ante la autoridad de control de protección de datos de su país.</p>

          <p className="mt-8 font-medium">Al utilizar CenterLex, usted acepta los términos de esta Política de Privacidad.</p>
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

export default Privacy;
