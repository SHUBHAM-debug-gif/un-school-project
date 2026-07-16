(() => {
"use strict";
const DATA = window.SITE_DATA;
// Defensive startup state: prevent empty overlays before any interaction.
["modal","tourCard","presentationControls","drawerBackdrop","crisisSim"].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.hidden=true;
});

const TEST_MODE = new URLSearchParams(location.search).has("test");
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const safe = (fn) => { try { fn(); } catch (error) { reportError(error); } };
function reportError(error){
  console.error(error);
  const box = $("#runtimeError");
  if(box){ box.hidden=false; box.textContent=String(error && error.stack || error); }
}
window.addEventListener("error", e => reportError(e.error || e.message));
window.addEventListener("unhandledrejection", e => reportError(e.reason));

const state = {
  lang:"en", agencyFilter:"All", agencySearch:"", councilVotes:{}, gaVotes:{}, gaClosed:false,
  quizLevel:"easy", quizIndex:0, quizScore:0, quizLocked:false,
  presentation:false, presentationIndex:0, tourIndex:0, sound:false
};

function toast(message){
  const el=$("#toast"); if(!el) return;
  el.textContent=message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2200);
}

function hideLoader(){
  if(typeof window.__releaseUNLoader==="function"){window.__releaseUNLoader();return;}
  const loader=$("#loader");
  if(loader){loader.classList.add("hidden");loader.style.pointerEvents="none";}
  document.body.classList.remove("no-scroll");
}
$("#skipLoader")?.addEventListener("click", hideLoader);
document.body.classList.add("no-scroll");
setTimeout(hideLoader, TEST_MODE ? 0 : 1050);

function initReveal(){
  const items=$$(".reveal");
  if(TEST_MODE || !("IntersectionObserver" in window)){
    items.forEach(x=>x.classList.add("visible")); return;
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add("visible"); observer.unobserve(entry.target); }});
  },{threshold:.12});
  items.forEach(x=>observer.observe(x));
}

function initScrollUI(){
  const progress=$("#scrollProgress");
  const links=$$("#mainNav a");
  const sections=links.map(a=>$(a.getAttribute("href"))).filter(Boolean);
  const update=()=>{
    const max=document.documentElement.scrollHeight-innerHeight;
    if(progress) progress.style.width=(max>0?scrollY/max*100:0)+"%";
    let active=sections[0]?.id;
    sections.forEach(section=>{ if(section.getBoundingClientRect().top<150) active=section.id; });
    links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+active));
  };
  addEventListener("scroll",update,{passive:true}); update();
}

function initCounters(){
  $$("[data-counter]").forEach(el=>{
    const target=Number(el.dataset.counter);
    if(TEST_MODE){el.textContent=target;return;}
    const start=performance.now(), duration=900;
    const tick=now=>{
      const p=Math.min(1,(now-start)/duration);
      el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
      if(p<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function updateClocks(){
  $$("[data-zone]").forEach(el=>{
    try{
      el.textContent=new Intl.DateTimeFormat(languageLocale(),{timeZone:el.dataset.zone,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());
    }catch{ el.textContent="--:--:--"; }
  });
}
updateClocks(); if(!TEST_MODE) setInterval(updateClocks,1000);

function initNavigation(){
  const menu=$("#menuBtn"), nav=$("#mainNav");
  menu?.addEventListener("click",()=>{
    const open=nav.classList.toggle("open");
    menu.setAttribute("aria-expanded",String(open));
  });
  $$("#mainNav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

  const drawer=$("#roomsDrawer"), backdrop=$("#drawerBackdrop");
  const openDrawer=()=>{drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");backdrop.hidden=false;document.body.classList.add("no-scroll");};
  const closeDrawer=()=>{drawer.classList.remove("open");drawer.setAttribute("aria-hidden","true");backdrop.hidden=true;document.body.classList.remove("no-scroll");};
  $("#roomsBtn")?.addEventListener("click",openDrawer);
  $("#roomsClose")?.addEventListener("click",closeDrawer);
  backdrop?.addEventListener("click",closeDrawer);
  $$(".room-list a").forEach(a=>a.addEventListener("click",closeDrawer));
}


const LANGUAGE_META={
  en:{code:"EN",flag:"🇬🇧",name:"English",locale:"en-IN"},
  hi:{code:"HI",flag:"🇮🇳",name:"हिन्दी",locale:"hi-IN"},
  fr:{code:"FR",flag:"🇫🇷",name:"Français",locale:"fr-FR"},
  es:{code:"ES",flag:"🇪🇸",name:"Español",locale:"es-ES"}
};
const UI_TRANSLATIONS={"Skip to main content":{"hi":"मुख्य सामग्री पर जाएँ","fr":"Aller au contenu principal","es":"Ir al contenido principal"},"Opening the United Nations Digital Museum":{"hi":"संयुक्त राष्ट्र डिजिटल संग्रहालय खुल रहा है","fr":"Ouverture du musée numérique des Nations Unies","es":"Abriendo el Museo Digital de las Naciones Unidas"},"Skip intro":{"hi":"परिचय छोड़ें","fr":"Passer l’introduction","es":"Saltar introducción"},"UNITED NATIONS":{"hi":"संयुक्त राष्ट्र","fr":"NATIONS UNIES","es":"NACIONES UNIDAS"},"UN MUSEUM":{"hi":"UN संग्रहालय","fr":"MUSÉE DE L’ONU","es":"MUSEO DE LA ONU"},"ECOSYSTEM MUSEUM":{"hi":"पारिस्थितिकी संग्रहालय","fr":"MUSÉE DE L’ÉCOSYSTÈME","es":"MUSEO DEL ECOSISTEMA"},"Charter":{"hi":"चार्टर","fr":"Charte","es":"Carta"},"Ecosystem":{"hi":"पारिस्थितिकी","fr":"Écosystème","es":"Ecosistema"},"Agencies":{"hi":"एजेंसियाँ","fr":"Agences","es":"Agencias"},"Our Work":{"hi":"हमारा कार्य","fr":"Notre action","es":"Nuestra labor"},"World Map":{"hi":"विश्व मानचित्र","fr":"Carte du monde","es":"Mapa mundial"},"Peacekeeping":{"hi":"शांति स्थापना","fr":"Maintien de la paix","es":"Mantenimiento de la paz"},"Simulators":{"hi":"सिमुलेटर","fr":"Simulateurs","es":"Simuladores"},"Learning Lab":{"hi":"अध्ययन प्रयोगशाला","fr":"Laboratoire pédagogique","es":"Laboratorio de aprendizaje"},"Search Museum":{"hi":"संग्रहालय खोजें","fr":"Rechercher dans le musée","es":"Buscar en el museo"},"My Passport":{"hi":"मेरा पासपोर्ट","fr":"Mon passeport","es":"Mi pasaporte"},"Narrate Section":{"hi":"अनुभाग सुनाएँ","fr":"Lire la section","es":"Narrar la sección"},"Situation Room":{"hi":"स्थिति कक्ष","fr":"Salle de situation","es":"Sala de situación"},"Build Resolution":{"hi":"प्रस्ताव बनाएँ","fr":"Rédiger une résolution","es":"Crear una resolución"},"Install App":{"hi":"ऐप इंस्टॉल करें","fr":"Installer l’application","es":"Instalar la aplicación"},"Accessibility":{"hi":"सुगम्यता","fr":"Accessibilité","es":"Accesibilidad"},"Presenter":{"hi":"प्रस्तुतकर्ता","fr":"Présentateur","es":"Presentador"},"Music Player":{"hi":"संगीत प्लेयर","fr":"Lecteur musical","es":"Reproductor de música"},"Search":{"hi":"खोजें","fr":"Rechercher","es":"Buscar"},"Narrate":{"hi":"सुनाएँ","fr":"Lire","es":"Narrar"},"Passport":{"hi":"पासपोर्ट","fr":"Passeport","es":"Pasaporte"},"Rooms":{"hi":"कक्ष","fr":"Salles","es":"Salas"},"Install":{"hi":"इंस्टॉल","fr":"Installer","es":"Instalar"},"Control":{"hi":"नियंत्रण","fr":"Contrôle","es":"Control"},"Present":{"hi":"प्रस्तुत करें","fr":"Présenter","es":"Presentar"},"Menu":{"hi":"मेनू","fr":"Menu","es":"Menú"},"DIGITAL MUSEUM MAP":{"hi":"डिजिटल संग्रहालय मानचित्र","fr":"PLAN DU MUSÉE NUMÉRIQUE","es":"MAPA DEL MUSEO DIGITAL"},"Exhibition Rooms":{"hi":"प्रदर्शनी कक्ष","fr":"Salles d’exposition","es":"Salas de exposición"},"Close rooms":{"hi":"कक्ष बंद करें","fr":"Fermer les salles","es":"Cerrar salas"},"Website tools":{"hi":"वेबसाइट उपकरण","fr":"Outils du site","es":"Herramientas del sitio"},"Opening Earth":{"hi":"प्रारंभिक पृथ्वी","fr":"Terre d’ouverture","es":"Tierra de apertura"},"UN Charter & Values":{"hi":"UN चार्टर और मूल्य","fr":"Charte et valeurs de l’ONU","es":"Carta y valores de la ONU"},"UN Ecosystem":{"hi":"UN पारिस्थितिकी तंत्र","fr":"Écosystème de l’ONU","es":"Ecosistema de la ONU"},"Organs & Agencies":{"hi":"अंग और एजेंसियाँ","fr":"Organes et agences","es":"Órganos y agencias"},"Agency Comparison":{"hi":"एजेंसी तुलना","fr":"Comparaison des agences","es":"Comparación de agencias"},"UN in Action":{"hi":"कार्यरत संयुक्त राष्ट्र","fr":"L’ONU en action","es":"La ONU en acción"},"Funding & Priorities Lab":{"hi":"वित्त और प्राथमिकता प्रयोगशाला","fr":"Laboratoire financement et priorités","es":"Laboratorio de financiación y prioridades"},"Global Headquarters":{"hi":"वैश्विक मुख्यालय","fr":"Sièges mondiaux","es":"Sedes mundiales"},"193 Countries Explorer":{"hi":"193 देशों का अन्वेषक","fr":"Explorateur des 193 pays","es":"Explorador de 193 países"},"Peacekeeping Centre":{"hi":"शांति स्थापना केंद्र","fr":"Centre du maintien de la paix","es":"Centro de mantenimiento de la paz"},"Global Situation Room":{"hi":"वैश्विक स्थिति कक्ष","fr":"Salle de situation mondiale","es":"Sala de situación mundial"},"SDG Gallery":{"hi":"SDG गैलरी","fr":"Galerie des ODD","es":"Galería de los ODS"},"Decision Chamber":{"hi":"निर्णय कक्ष","fr":"Chambre de décision","es":"Cámara de decisiones"},"SDG City 2030":{"hi":"SDG नगर 2030","fr":"Ville ODD 2030","es":"Ciudad ODS 2030"},"Photo Gallery":{"hi":"फोटो गैलरी","fr":"Galerie de photos","es":"Galería de fotos"},"Chamber Hotspot Tour":{"hi":"कक्ष हॉटस्पॉट भ्रमण","fr":"Visite interactive des salles","es":"Recorrido interactivo por las salas"},"India & the UN":{"hi":"भारत और संयुक्त राष्ट्र","fr":"L’Inde et l’ONU","es":"India y la ONU"},"History Museum":{"hi":"इतिहास संग्रहालय","fr":"Musée de l’histoire","es":"Museo de historia"},"International Days":{"hi":"अंतरराष्ट्रीय दिवस","fr":"Journées internationales","es":"Días internacionales"},"Knowledge Centre":{"hi":"ज्ञान केंद्र","fr":"Centre de connaissances","es":"Centro de conocimiento"},"Diplomacy Lab":{"hi":"कूटनीति प्रयोगशाला","fr":"Laboratoire de diplomatie","es":"Laboratorio de diplomacia"},"Resolution Builder":{"hi":"प्रस्ताव निर्माता","fr":"Créateur de résolution","es":"Creador de resoluciones"},"UN Careers Explorer":{"hi":"UN करियर अन्वेषक","fr":"Explorateur des carrières de l’ONU","es":"Explorador de carreras de la ONU"},"TENDER HEART SCHOOL • SOCIAL SCIENCE EXHIBITION 2026":{"hi":"टेंडर हार्ट स्कूल • सामाजिक विज्ञान प्रदर्शनी 2026","fr":"TENDER HEART SCHOOL • EXPOSITION DE SCIENCES SOCIALES 2026","es":"TENDER HEART SCHOOL • EXPOSICIÓN DE CIENCIAS SOCIALES 2026"},"THE FULL":{"hi":"पूर्ण","fr":"L’ÉCOSYSTÈME","es":"EL ECOSISTEMA"},"ECOSYSTEM":{"hi":"पारिस्थितिकी तंत्र","fr":"COMPLET","es":"COMPLETO"},"A cinematic and interactive journey through the organs, agencies and global programmes working for peace, dignity, equality and a healthy planet.":{"hi":"शांति, गरिमा, समानता और स्वस्थ पृथ्वी के लिए कार्य करने वाले अंगों, एजेंसियों और वैश्विक कार्यक्रमों की एक सिनेमाई तथा इंटरैक्टिव यात्रा।","fr":"Un voyage cinématographique et interactif à travers les organes, agences et programmes mondiaux qui œuvrent pour la paix, la dignité, l’égalité et une planète saine.","es":"Un viaje cinematográfico e interactivo por los órganos, agencias y programas mundiales que trabajan por la paz, la dignidad, la igualdad y un planeta saludable."},"Enter the Museum":{"hi":"संग्रहालय में प्रवेश करें","fr":"Entrer dans le musée","es":"Entrar al museo"},"Start Guided Tour":{"hi":"मार्गदर्शित यात्रा शुरू करें","fr":"Commencer la visite guidée","es":"Iniciar visita guiada"},"🌍 Interactive Museum":{"hi":"🌍 इंटरैक्टिव संग्रहालय","fr":"🌍 Musée interactif","es":"🌍 Museo interactivo"},"📱 Mobile First":{"hi":"📱 मोबाइल अनुकूल","fr":"📱 Priorité au mobile","es":"📱 Diseñado para móviles"},"🔗 Official Sources":{"hi":"🔗 आधिकारिक स्रोत","fr":"🔗 Sources officielles","es":"🔗 Fuentes oficiales"},"⚡ Offline Ready":{"hi":"⚡ ऑफलाइन तैयार","fr":"⚡ Disponible hors ligne","es":"⚡ Disponible sin conexión"},"Verified educational content":{"hi":"सत्यापित शैक्षिक सामग्री","fr":"Contenu éducatif vérifié","es":"Contenido educativo verificado"},"School Exhibition Edition":{"hi":"विद्यालय प्रदर्शनी संस्करण","fr":"Édition exposition scolaire","es":"Edición para exposición escolar"},"Updated July 2026":{"hi":"जुलाई 2026 में अद्यतन","fr":"Mis à jour en juillet 2026","es":"Actualizado en julio de 2026"},"UN Offices":{"hi":"UN कार्यालय","fr":"Bureaux de l’ONU","es":"Oficinas de la ONU"},"Voting Hall":{"hi":"मतदान कक्ष","fr":"Salle de vote","es":"Sala de votación"},"Future 2030":{"hi":"भविष्य 2030","fr":"Avenir 2030","es":"Futuro 2030"},"India & UN":{"hi":"भारत और UN","fr":"Inde et ONU","es":"India y ONU"},"Global role":{"hi":"वैश्विक भूमिका","fr":"Rôle mondial","es":"Papel mundial"},"Member States":{"hi":"सदस्य देश","fr":"États Membres","es":"Estados Miembros"},"Principal Organs":{"hi":"प्रधान अंग","fr":"Organes principaux","es":"Órganos principales"},"Global Goals":{"hi":"वैश्विक लक्ष्य","fr":"Objectifs mondiaux","es":"Objetivos mundiales"},"Peacekeeping Missions":{"hi":"शांति मिशन","fr":"Missions de paix","es":"Misiones de paz"},"THE FOUNDING DOCUMENT":{"hi":"स्थापना दस्तावेज़","fr":"LE DOCUMENT FONDATEUR","es":"EL DOCUMENTO FUNDACIONAL"},"The UN Charter and Its Core Values":{"hi":"UN चार्टर और उसके मूल मूल्य","fr":"La Charte de l’ONU et ses valeurs fondamentales","es":"La Carta de la ONU y sus valores fundamentales"},"The Charter is the constitutional foundation of the United Nations. It explains the Organization’s purposes, principles, institutions and responsibilities.":{"hi":"चार्टर संयुक्त राष्ट्र की संवैधानिक नींव है। यह संगठन के उद्देश्यों, सिद्धांतों, संस्थाओं और जिम्मेदारियों को समझाता है।","fr":"La Charte constitue le fondement constitutionnel des Nations Unies. Elle définit les buts, principes, institutions et responsabilités de l’Organisation.","es":"La Carta es la base constitucional de las Naciones Unidas. Explica los propósitos, principios, instituciones y responsabilidades de la Organización."},"Charter of the United Nations":{"hi":"संयुक्त राष्ट्र चार्टर","fr":"Charte des Nations Unies","es":"Carta de las Naciones Unidas"},"Read the Official Charter":{"hi":"आधिकारिक चार्टर पढ़ें","fr":"Lire la Charte officielle","es":"Leer la Carta oficial"},"Peace":{"hi":"शांति","fr":"Paix","es":"Paz"},"Human Dignity":{"hi":"मानवीय गरिमा","fr":"Dignité humaine","es":"Dignidad humana"},"Equality":{"hi":"समानता","fr":"Égalité","es":"Igualdad"},"Cooperation":{"hi":"सहयोग","fr":"Coopération","es":"Cooperación"},"International Law":{"hi":"अंतरराष्ट्रीय कानून","fr":"Droit international","es":"Derecho internacional"},"Future Generations":{"hi":"भावी पीढ़ियाँ","fr":"Générations futures","es":"Generaciones futuras"},"SIX OFFICIAL LANGUAGES":{"hi":"छह आधिकारिक भाषाएँ","fr":"SIX LANGUES OFFICIELLES","es":"SEIS IDIOMAS OFICIALES"},"A multilingual global organization":{"hi":"एक बहुभाषी वैश्विक संगठन","fr":"Une organisation mondiale multilingue","es":"Una organización mundial multilingüe"},"THE COMPLETE SYSTEM":{"hi":"संपूर्ण प्रणाली","fr":"LE SYSTÈME COMPLET","es":"EL SISTEMA COMPLETO"},"One Organization. Many Connected Parts.":{"hi":"एक संगठन। अनेक जुड़े हुए भाग।","fr":"Une organisation, de nombreux éléments reliés.","es":"Una organización, muchas partes conectadas."},"Explore the UN ecosystem":{"hi":"UN पारिस्थितिकी तंत्र देखें","fr":"Explorer l’écosystème de l’ONU","es":"Explorar el ecosistema de la ONU"},"Click a connected part to understand its role.":{"hi":"किसी जुड़े भाग की भूमिका समझने के लिए उस पर क्लिक करें।","fr":"Cliquez sur un élément relié pour comprendre son rôle.","es":"Haz clic en una parte conectada para comprender su función."},"OFFICIAL ORGANIZATIONS":{"hi":"आधिकारिक संगठन","fr":"ORGANISATIONS OFFICIELLES","es":"ORGANIZACIONES OFICIALES"},"Agency and Organ Explorer":{"hi":"एजेंसी और अंग अन्वेषक","fr":"Explorateur des agences et organes","es":"Explorador de agencias y órganos"},"Search or filter the cards. Every profile contains a local QR code for its official website.":{"hi":"कार्ड खोजें या फ़िल्टर करें। प्रत्येक प्रोफ़ाइल में आधिकारिक वेबसाइट का स्थानीय QR कोड है।","fr":"Recherchez ou filtrez les cartes. Chaque profil contient un code QR local vers son site officiel.","es":"Busca o filtra las tarjetas. Cada perfil contiene un código QR local para su sitio oficial."},"No matching organization found.":{"hi":"कोई मेल खाने वाला संगठन नहीं मिला।","fr":"Aucune organisation correspondante trouvée.","es":"No se encontró una organización coincidente."},"AGENCY COMPARISON LAB":{"hi":"एजेंसी तुलना प्रयोगशाला","fr":"LABORATOIRE DE COMPARAISON DES AGENCES","es":"LABORATORIO DE COMPARACIÓN DE AGENCIAS"},"Compare Two UN Organizations":{"hi":"दो UN संगठनों की तुलना करें","fr":"Comparer deux organisations de l’ONU","es":"Comparar dos organizaciones de la ONU"},"Organization A":{"hi":"संगठन A","fr":"Organisation A","es":"Organización A"},"Organization B":{"hi":"संगठन B","fr":"Organisation B","es":"Organización B"},"Swap ↔":{"hi":"बदलें ↔","fr":"Inverser ↔","es":"Intercambiar ↔"},"THE UN IN ACTION":{"hi":"कार्यरत संयुक्त राष्ट्र","fr":"L’ONU EN ACTION","es":"LA ONU EN ACCIÓN"},"From International Decisions to Real-World Action":{"hi":"अंतरराष्ट्रीय निर्णयों से वास्तविक कार्य तक","fr":"Des décisions internationales à l’action concrète","es":"De las decisiones internacionales a la acción real"},"Peace & Security":{"hi":"शांति और सुरक्षा","fr":"Paix et sécurité","es":"Paz y seguridad"},"Human Rights":{"hi":"मानवाधिकार","fr":"Droits humains","es":"Derechos humanos"},"Humanitarian Action":{"hi":"मानवीय कार्रवाई","fr":"Action humanitaire","es":"Acción humanitaria"},"Development":{"hi":"विकास","fr":"Développement","es":"Desarrollo"},"Prevent, mediate, protect and rebuild":{"hi":"रोकथाम, मध्यस्थता, सुरक्षा और पुनर्निर्माण","fr":"Prévenir, négocier, protéger et reconstruire","es":"Prevenir, mediar, proteger y reconstruir"},"Explore Peacekeeping":{"hi":"शांति स्थापना देखें","fr":"Explorer le maintien de la paix","es":"Explorar el mantenimiento de la paz"},"Identify":{"hi":"पहचानें","fr":"Identifier","es":"Identificar"},"Decide":{"hi":"निर्णय लें","fr":"Décider","es":"Decidir"},"Coordinate":{"hi":"समन्वय करें","fr":"Coordonner","es":"Coordinar"},"Deliver":{"hi":"सेवा पहुँचाएँ","fr":"Mettre en œuvre","es":"Entregar"},"Review":{"hi":"समीक्षा करें","fr":"Évaluer","es":"Revisar"},"GLOBAL ISSUES EXPLORER":{"hi":"वैश्विक मुद्दा अन्वेषक","fr":"EXPLORATEUR DES ENJEUX MONDIAUX","es":"EXPLORADOR DE PROBLEMAS MUNDIALES"},"EDUCATIONAL FUNDING MODEL":{"hi":"शैक्षिक वित्त मॉडल","fr":"MODÈLE ÉDUCATIF DE FINANCEMENT","es":"MODELO EDUCATIVO DE FINANCIACIÓN"},"Build a Global Cooperation Plan":{"hi":"वैश्विक सहयोग योजना बनाएँ","fr":"Construire un plan de coopération mondiale","es":"Crear un plan de cooperación mundial"},"Points allocated":{"hi":"आवंटित अंक","fr":"Points attribués","es":"Puntos asignados"},"Points remaining":{"hi":"शेष अंक","fr":"Points restants","es":"Puntos restantes"},"Balanced Plan":{"hi":"संतुलित योजना","fr":"Plan équilibré","es":"Plan equilibrado"},"Emergency Plan":{"hi":"आपातकालीन योजना","fr":"Plan d’urgence","es":"Plan de emergencia"},"Reset":{"hi":"रीसेट","fr":"Réinitialiser","es":"Restablecer"},"YOUR PRIORITY PROFILE":{"hi":"आपकी प्राथमिकता प्रोफ़ाइल","fr":"VOTRE PROFIL DE PRIORITÉS","es":"TU PERFIL DE PRIORIDADES"},"Balanced global cooperation":{"hi":"संतुलित वैश्विक सहयोग","fr":"Coopération mondiale équilibrée","es":"Cooperación mundial equilibrada"},"GLOBAL PRESENCE":{"hi":"वैश्विक उपस्थिति","fr":"PRÉSENCE MONDIALE","es":"PRESENCIA MUNDIAL"},"Interactive Headquarters Map":{"hi":"इंटरैक्टिव मुख्यालय मानचित्र","fr":"Carte interactive des sièges","es":"Mapa interactivo de sedes"},"Select a city to discover major UN offices and organizations.":{"hi":"प्रमुख UN कार्यालयों और संगठनों को जानने के लिए शहर चुनें।","fr":"Sélectionnez une ville pour découvrir les principaux bureaux et organisations de l’ONU.","es":"Selecciona una ciudad para descubrir las principales oficinas y organizaciones de la ONU."},"SELECT A LOCATION":{"hi":"स्थान चुनें","fr":"CHOISIR UN LIEU","es":"SELECCIONA UN LUGAR"},"Worldwide UN Network":{"hi":"विश्वव्यापी UN नेटवर्क","fr":"Réseau mondial de l’ONU","es":"Red mundial de la ONU"},"193 MEMBER STATES":{"hi":"193 सदस्य देश","fr":"193 ÉTATS MEMBRES","es":"193 ESTADOS MIEMBROS"},"Country and Region Explorer":{"hi":"देश और क्षेत्र अन्वेषक","fr":"Explorateur des pays et régions","es":"Explorador de países y regiones"},"Random Spotlight":{"hi":"यादृच्छिक देश","fr":"Pays aléatoire","es":"País aleatorio"},"Select a country card":{"hi":"देश का कार्ड चुनें","fr":"Sélectionnez une carte de pays","es":"Selecciona una tarjeta de país"},"Show More Countries":{"hi":"और देश दिखाएँ","fr":"Afficher plus de pays","es":"Mostrar más países"},"COUNTRY SPOTLIGHT":{"hi":"देश परिचय","fr":"PAYS À LA UNE","es":"PAÍS DESTACADO"},"Select a Member State":{"hi":"सदस्य देश चुनें","fr":"Sélectionnez un État Membre","es":"Selecciona un Estado Miembro"},"PEACE IN ACTION":{"hi":"कार्य में शांति","fr":"LA PAIX EN ACTION","es":"LA PAZ EN ACCIÓN"},"Peacekeeping Command Centre":{"hi":"शांति स्थापना कमांड केंद्र","fr":"Centre de commandement du maintien de la paix","es":"Centro de mando de mantenimiento de la paz"},"Current missions":{"hi":"वर्तमान मिशन","fr":"Missions actuelles","es":"Misiones actuales"},"Personnel serving":{"hi":"सेवारत कर्मी","fr":"Personnel en service","es":"Personal en servicio"},"Peacekeeping began":{"hi":"शांति स्थापना शुरू हुई","fr":"Début du maintien de la paix","es":"Inicio del mantenimiento de la paz"},"Early warning":{"hi":"प्रारंभिक चेतावनी","fr":"Alerte précoce","es":"Alerta temprana"},"Diplomacy":{"hi":"कूटनीति","fr":"Diplomatie","es":"Diplomacia"},"Mandate":{"hi":"अधिदेश","fr":"Mandat","es":"Mandato"},"Deployment":{"hi":"तैनाती","fr":"Déploiement","es":"Despliegue"},"GLOBAL DECISION-MAKING":{"hi":"वैश्विक निर्णय-निर्माण","fr":"PRISE DE DÉCISION MONDIALE","es":"TOMA DE DECISIONES MUNDIAL"},"United Nations Global Situation Room":{"hi":"संयुक्त राष्ट्र वैश्विक स्थिति कक्ष","fr":"Salle de situation mondiale des Nations Unies","es":"Sala de situación mundial de las Naciones Unidas"},"SELECT SCENARIO":{"hi":"परिदृश्य चुनें","fr":"CHOISIR UN SCÉNARIO","es":"SELECCIONA UN ESCENARIO"},"SITUATION BRIEF":{"hi":"स्थिति विवरण","fr":"NOTE DE SITUATION","es":"RESUMEN DE SITUACIÓN"},"SIMULATED RESPONSE WINDOW":{"hi":"अनुकरणीय प्रतिक्रिया समय","fr":"FENÊTRE DE RÉPONSE SIMULÉE","es":"VENTANA DE RESPUESTA SIMULADA"},"Protection":{"hi":"सुरक्षा","fr":"Protection","es":"Protección"},"OUTCOME PENDING":{"hi":"परिणाम लंबित","fr":"RÉSULTAT EN ATTENTE","es":"RESULTADO PENDIENTE"},"Complete all three decisions":{"hi":"तीनों निर्णय पूरे करें","fr":"Prenez les trois décisions","es":"Completa las tres decisiones"},"Evaluate Response":{"hi":"प्रतिक्रिया का मूल्यांकन करें","fr":"Évaluer la réponse","es":"Evaluar la respuesta"},"Reset Decisions":{"hi":"निर्णय रीसेट करें","fr":"Réinitialiser les décisions","es":"Restablecer decisiones"},"AGENDA 2030":{"hi":"एजेंडा 2030","fr":"PROGRAMME 2030","es":"AGENDA 2030"},"The 17 Sustainable Development Goals":{"hi":"17 सतत विकास लक्ष्य","fr":"Les 17 objectifs de développement durable","es":"Los 17 Objetivos de Desarrollo Sostenible"},"INTERACTIVE FUTURE":{"hi":"इंटरैक्टिव भविष्य","fr":"AVENIR INTERACTIF","es":"FUTURO INTERACTIVO"},"CLICK A BUILDING":{"hi":"भवन पर क्लिक करें","fr":"CLIQUEZ SUR UN BÂTIMENT","es":"HAZ CLIC EN UN EDIFICIO"},"A city where every goal connects":{"hi":"एक शहर जहाँ हर लक्ष्य जुड़ा है","fr":"Une ville où chaque objectif est relié","es":"Una ciudad donde cada objetivo está conectado"},"People":{"hi":"लोग","fr":"Personnes","es":"Personas"},"Planet":{"hi":"पृथ्वी","fr":"Planète","es":"Planeta"},"Prosperity":{"hi":"समृद्धि","fr":"Prospérité","es":"Prosperidad"},"BECOME A DELEGATE":{"hi":"प्रतिनिधि बनें","fr":"DEVENEZ DÉLÉGUÉ","es":"CONVIÉRTETE EN DELEGADO"},"Interactive Decision Simulators":{"hi":"इंटरैक्टिव निर्णय सिमुलेटर","fr":"Simulateurs interactifs de décision","es":"Simuladores interactivos de decisiones"},"General Assembly":{"hi":"महासभा","fr":"Assemblée générale","es":"Asamblea General"},"Humanitarian Crisis":{"hi":"मानवीय संकट","fr":"Crise humanitaire","es":"Crisis humanitaria"},"Model UN Challenge":{"hi":"मॉडल UN चुनौती","fr":"Défi de simulation ONU","es":"Desafío Modelo ONU"},"Security Council Voting Board":{"hi":"सुरक्षा परिषद मतदान बोर्ड","fr":"Tableau de vote du Conseil de sécurité","es":"Panel de votación del Consejo de Seguridad"},"YES":{"hi":"हाँ","fr":"OUI","es":"SÍ"},"NO":{"hi":"नहीं","fr":"NON","es":"NO"},"ABSTAIN":{"hi":"अनुपस्थित मत","fr":"ABSTENTION","es":"ABSTENCIÓN"},"Awaiting votes":{"hi":"मतों की प्रतीक्षा","fr":"En attente des votes","es":"Esperando votos"},"Passing Example":{"hi":"स्वीकृति उदाहरण","fr":"Exemple d’adoption","es":"Ejemplo de aprobación"},"Veto Example":{"hi":"वीटो उदाहरण","fr":"Exemple de veto","es":"Ejemplo de veto"},"General Assembly Voting Hall":{"hi":"महासभा मतदान कक्ष","fr":"Salle de vote de l’Assemblée générale","es":"Sala de votación de la Asamblea General"},"Official Rules":{"hi":"आधिकारिक नियम","fr":"Règles officielles","es":"Reglas oficiales"},"Reset Hall":{"hi":"कक्ष रीसेट करें","fr":"Réinitialiser la salle","es":"Restablecer sala"},"INTERACTIVE CHAMBER TOUR":{"hi":"इंटरैक्टिव कक्ष भ्रमण","fr":"VISITE INTERACTIVE DES SALLES","es":"RECORRIDO INTERACTIVO POR LAS SALAS"},"Explore the Rooms Where Diplomacy Happens":{"hi":"उन कक्षों को देखें जहाँ कूटनीति होती है","fr":"Explorez les salles où se déroule la diplomatie","es":"Explora las salas donde ocurre la diplomacia"},"SELECT A HOTSPOT":{"hi":"हॉटस्पॉट चुनें","fr":"SÉLECTIONNER UN POINT","es":"SELECCIONA UN PUNTO"},"General Assembly Hall":{"hi":"महासभा कक्ष","fr":"Salle de l’Assemblée générale","es":"Salón de la Asamblea General"},"Tap a glowing marker to learn how the chamber functions.":{"hi":"कक्ष की कार्यप्रणाली जानने के लिए चमकते चिह्न पर टैप करें।","fr":"Touchez un repère lumineux pour découvrir le fonctionnement de la salle.","es":"Toca un marcador brillante para conocer cómo funciona la sala."},"INDIA AND GLOBAL COOPERATION":{"hi":"भारत और वैश्विक सहयोग","fr":"L’INDE ET LA COOPÉRATION MONDIALE","es":"INDIA Y LA COOPERACIÓN MUNDIAL"},"India and the United Nations":{"hi":"भारत और संयुक्त राष्ट्र","fr":"L’Inde et les Nations Unies","es":"India y las Naciones Unidas"},"FOUNDING MEMBER":{"hi":"संस्थापक सदस्य","fr":"MEMBRE FONDATEUR","es":"MIEMBRO FUNDADOR"},"Official UN India Website":{"hi":"आधिकारिक UN भारत वेबसाइट","fr":"Site officiel de l’ONU en Inde","es":"Sitio oficial de la ONU en India"},"Founding Member State":{"hi":"संस्थापक सदस्य देश","fr":"État Membre fondateur","es":"Estado Miembro fundador"},"Explore Indian Peacekeeping":{"hi":"भारतीय शांति स्थापना देखें","fr":"Explorer le maintien de la paix indien","es":"Explorar el mantenimiento de la paz de India"},"Ask AI About India":{"hi":"AI से भारत के बारे में पूछें","fr":"Interroger l’IA sur l’Inde","es":"Preguntar a la IA sobre India"},"HISTORY MUSEUM":{"hi":"इतिहास संग्रहालय","fr":"MUSÉE DE L’HISTOIRE","es":"MUSEO DE HISTORIA"},"Eight Decades of Cooperation":{"hi":"आठ दशकों का सहयोग","fr":"Huit décennies de coopération","es":"Ocho décadas de cooperación"},"United Nations Founded":{"hi":"संयुक्त राष्ट्र की स्थापना","fr":"Fondation des Nations Unies","es":"Fundación de las Naciones Unidas"},"Human Rights Declaration":{"hi":"मानवाधिकार घोषणा","fr":"Déclaration des droits humains","es":"Declaración de Derechos Humanos"},"Peacekeeping Begins":{"hi":"शांति स्थापना की शुरुआत","fr":"Début du maintien de la paix","es":"Comienza el mantenimiento de la paz"},"Decolonization":{"hi":"उपनिवेशवाद का अंत","fr":"Décolonisation","es":"Descolonización"},"Millennium Development Goals":{"hi":"सहस्राब्दी विकास लक्ष्य","fr":"Objectifs du Millénaire pour le développement","es":"Objetivos de Desarrollo del Milenio"},"SDGs Adopted":{"hi":"SDG अपनाए गए","fr":"Adoption des ODD","es":"Adopción de los ODS"},"GLOBAL OBSERVANCES":{"hi":"वैश्विक आयोजन","fr":"CÉLÉBRATIONS MONDIALES","es":"CONMEMORACIONES MUNDIALES"},"United Nations International Days Calendar":{"hi":"संयुक्त राष्ट्र अंतरराष्ट्रीय दिवस कैलेंडर","fr":"Calendrier des Journées internationales des Nations Unies","es":"Calendario de Días Internacionales de las Naciones Unidas"},"Month":{"hi":"महीना","fr":"Mois","es":"Mes"},"Show Current Month":{"hi":"वर्तमान महीना दिखाएँ","fr":"Afficher le mois actuel","es":"Mostrar mes actual"},"United Nations Day":{"hi":"संयुक्त राष्ट्र दिवस","fr":"Journée des Nations Unies","es":"Día de las Naciones Unidas"},"Official Observance Page":{"hi":"आधिकारिक आयोजन पृष्ठ","fr":"Page officielle de la journée","es":"Página oficial de la conmemoración"},"PROFESSIONAL REFERENCE CENTRE":{"hi":"व्यावसायिक संदर्भ केंद्र","fr":"CENTRE DE RÉFÉRENCE","es":"CENTRO DE REFERENCIA PROFESIONAL"},"UN Knowledge Centre":{"hi":"UN ज्ञान केंद्र","fr":"Centre de connaissances de l’ONU","es":"Centro de conocimiento de la ONU"},"SEARCHABLE GLOSSARY":{"hi":"खोज योग्य शब्दावली","fr":"GLOSSAIRE CONSULTABLE","es":"GLOSARIO DE BÚSQUEDA"},"Key UN Terms":{"hi":"मुख्य UN शब्द","fr":"Termes clés de l’ONU","es":"Términos clave de la ONU"},"HOW A RESOLUTION BECOMES ACTION":{"hi":"प्रस्ताव कैसे कार्रवाई बनता है","fr":"COMMENT UNE RÉSOLUTION DEVIENT ACTION","es":"CÓMO UNA RESOLUCIÓN SE CONVIERTE EN ACCIÓN"},"Decision pathway":{"hi":"निर्णय प्रक्रिया","fr":"Parcours décisionnel","es":"Ruta de decisión"},"Issue raised":{"hi":"मुद्दा उठाया गया","fr":"Question soulevée","es":"Tema planteado"},"Draft prepared":{"hi":"मसौदा तैयार","fr":"Projet préparé","es":"Borrador preparado"},"Negotiation":{"hi":"वार्ता","fr":"Négociation","es":"Negociación"},"Vote":{"hi":"मतदान","fr":"Vote","es":"Votación"},"Implementation":{"hi":"कार्यान्वयन","fr":"Mise en œuvre","es":"Implementación"},"LEARNING LAB":{"hi":"अध्ययन प्रयोगशाला","fr":"LABORATOIRE PÉDAGOGIQUE","es":"LABORATORIO DE APRENDIZAJE"},"Quiz, Games and UN Assistant":{"hi":"प्रश्नोत्तरी, खेल और संयुक्त राष्ट्र सहायक","fr":"Quiz, jeux et assistant ONU","es":"Cuestionarios, juegos y asistente de la ONU"},"DAILY MUSEUM CHALLENGE":{"hi":"दैनिक संग्रहालय चुनौती","fr":"DÉFI QUOTIDIEN DU MUSÉE","es":"DESAFÍO DIARIO DEL MUSEO"},"Complete one interactive activity":{"hi":"एक इंटरैक्टिव गतिविधि पूरी करें","fr":"Terminez une activité interactive","es":"Completa una actividad interactiva"},"Start Challenge":{"hi":"चुनौती शुरू करें","fr":"Commencer le défi","es":"Iniciar desafío"},"Mark Complete":{"hi":"पूर्ण चिह्नित करें","fr":"Marquer comme terminé","es":"Marcar como completado"},"UN Knowledge Challenge":{"hi":"UN ज्ञान चुनौती","fr":"Défi de connaissances sur l’ONU","es":"Desafío de conocimientos de la ONU"},"Next":{"hi":"अगला","fr":"Suivant","es":"Siguiente"},"UN AI Guide":{"hi":"UN AI मार्गदर्शक","fr":"Guide IA de l’ONU","es":"Guía de IA de la ONU"},"Smart offline exhibition assistant":{"hi":"स्मार्ट ऑफलाइन प्रदर्शनी सहायक","fr":"Assistant intelligent hors ligne","es":"Asistente inteligente sin conexión"},"Send":{"hi":"भेजें","fr":"Envoyer","es":"Enviar"},"Guess the Agency":{"hi":"एजेंसी पहचानें","fr":"Devinez l’agence","es":"Adivina la agencia"},"Printable Museum Certificate":{"hi":"प्रिंट योग्य संग्रहालय प्रमाणपत्र","fr":"Certificat du musée imprimable","es":"Certificado imprimible del museo"},"Create Certificate":{"hi":"प्रमाणपत्र बनाएँ","fr":"Créer le certificat","es":"Crear certificado"},"NEGOTIATION & COOPERATION":{"hi":"वार्ता और सहयोग","fr":"NÉGOCIATION ET COOPÉRATION","es":"NEGOCIACIÓN Y COOPERACIÓN"},"Diplomacy and Treaty-Building Lab":{"hi":"कूटनीति और संधि-निर्माण प्रयोगशाला","fr":"Laboratoire de diplomatie et de traités","es":"Laboratorio de diplomacia y tratados"},"DRAFT AGREEMENT":{"hi":"मसौदा समझौता","fr":"PROJET D’ACCORD","es":"BORRADOR DE ACUERDO"},"Delegation A":{"hi":"प्रतिनिधिमंडल A","fr":"Délégation A","es":"Delegación A"},"Delegation B":{"hi":"प्रतिनिधिमंडल B","fr":"Délégation B","es":"Delegación B"},"SELECT FOUR CLAUSES":{"hi":"चार धाराएँ चुनें","fr":"CHOISISSEZ QUATRE CLAUSES","es":"SELECCIONA CUATRO CLÁUSULAS"},"Final statement":{"hi":"अंतिम वक्तव्य","fr":"Déclaration finale","es":"Declaración final"},"Evaluate Agreement":{"hi":"समझौते का मूल्यांकन करें","fr":"Évaluer l’accord","es":"Evaluar el acuerdo"},"Print Treaty":{"hi":"संधि प्रिंट करें","fr":"Imprimer le traité","es":"Imprimir tratado"},"NEGOTIATION ANALYSIS":{"hi":"वार्ता विश्लेषण","fr":"ANALYSE DE LA NÉGOCIATION","es":"ANÁLISIS DE LA NEGOCIACIÓN"},"Build your agreement":{"hi":"अपना समझौता बनाएँ","fr":"Construisez votre accord","es":"Crea tu acuerdo"},"Diplomatic principles":{"hi":"कूटनीतिक सिद्धांत","fr":"Principes diplomatiques","es":"Principios diplomáticos"},"AGENCY RESPONSE TEAM BUILDER":{"hi":"एजेंसी प्रतिक्रिया दल निर्माता","fr":"CRÉATEUR D’ÉQUIPE D’INTERVENTION","es":"CREADOR DE EQUIPO DE RESPUESTA"},"Choose the correct UN response team":{"hi":"सही UN प्रतिक्रिया दल चुनें","fr":"Choisissez la bonne équipe d’intervention de l’ONU","es":"Elige el equipo de respuesta correcto de la ONU"},"New Scenario":{"hi":"नया परिदृश्य","fr":"Nouveau scénario","es":"Nuevo escenario"},"Select four agencies:":{"hi":"चार एजेंसियाँ चुनें:","fr":"Sélectionnez quatre agences :","es":"Selecciona cuatro agencias:"},"Check Team":{"hi":"दल जाँचें","fr":"Vérifier l’équipe","es":"Comprobar equipo"},"DRAFTING & NEGOTIATION":{"hi":"मसौदा और वार्ता","fr":"RÉDACTION ET NÉGOCIATION","es":"REDACCIÓN Y NEGOCIACIÓN"},"Build a United Nations Resolution":{"hi":"संयुक्त राष्ट्र प्रस्ताव बनाएँ","fr":"Rédiger une résolution des Nations Unies","es":"Crear una resolución de las Naciones Unidas"},"Committee":{"hi":"समिति","fr":"Comité","es":"Comité"},"Main sponsor":{"hi":"मुख्य प्रायोजक","fr":"Auteur principal","es":"Patrocinador principal"},"Topic":{"hi":"विषय","fr":"Sujet","es":"Tema"},"Co-sponsors":{"hi":"सह-प्रायोजक","fr":"Coauteurs","es":"Copatrocinadores"},"PREAMBULAR CLAUSES":{"hi":"प्रस्तावना धाराएँ","fr":"CLAUSES PRÉAMBULAIRES","es":"CLÁUSULAS PREAMBULATORIAS"},"OPERATIVE CLAUSES":{"hi":"क्रियात्मक धाराएँ","fr":"CLAUSES OPÉRATIVES","es":"CLÁUSULAS OPERATIVAS"},"Custom operative clause":{"hi":"कस्टम क्रियात्मक धारा","fr":"Clause opérative personnalisée","es":"Cláusula operativa personalizada"},"Improve Wording":{"hi":"भाषा सुधारें","fr":"Améliorer la formulation","es":"Mejorar redacción"},"Download Draft":{"hi":"मसौदा डाउनलोड करें","fr":"Télécharger le projet","es":"Descargar borrador"},"Print Resolution":{"hi":"प्रस्ताव प्रिंट करें","fr":"Imprimer la résolution","es":"Imprimir resolución"},"PEOPLE BEHIND THE MISSION":{"hi":"मिशन के पीछे के लोग","fr":"LES PERSONNES DERRIÈRE LA MISSION","es":"LAS PERSONAS DETRÁS DE LA MISIÓN"},"United Nations Careers and Skills Explorer":{"hi":"संयुक्त राष्ट्र करियर और कौशल अन्वेषक","fr":"Explorateur des carrières et compétences de l’ONU","es":"Explorador de carreras y habilidades de la ONU"},"FIND YOUR UN ROLE":{"hi":"अपनी UN भूमिका खोजें","fr":"TROUVEZ VOTRE RÔLE À L’ONU","es":"ENCUENTRA TU FUNCIÓN EN LA ONU"},"CAREER MATCH":{"hi":"करियर मिलान","fr":"PROFIL DE CARRIÈRE","es":"COINCIDENCIA PROFESIONAL"},"Complete the five questions":{"hi":"पाँच प्रश्न पूरे करें","fr":"Répondez aux cinq questions","es":"Completa las cinco preguntas"},"Restart Quiz":{"hi":"प्रश्नोत्तरी फिर शुरू करें","fr":"Recommencer le quiz","es":"Reiniciar cuestionario"},"PREMIUM ORIGINAL SOUNDTRACK":{"hi":"प्रीमियम मूल साउंडट्रैक","fr":"BANDE ORIGINALE PREMIUM","es":"BANDA SONORA ORIGINAL PREMIUM"},"Premium original soundtrack":{"hi":"प्रीमियम मूल साउंडट्रैक","fr":"Bande originale premium","es":"Banda sonora original premium"},"Automatic section themes":{"hi":"स्वचालित अनुभाग संगीत","fr":"Thèmes automatiques par section","es":"Temas automáticos por sección"},"Change music as visitors explore the museum":{"hi":"संग्रहालय देखते समय संगीत बदलें","fr":"Changer la musique selon la section visitée","es":"Cambiar la música según la sección visitada"},"Mute":{"hi":"म्यूट","fr":"Couper le son","es":"Silenciar"},"Unmute":{"hi":"ध्वनि चालू करें","fr":"Rétablir le son","es":"Activar sonido"},"Sleep timer":{"hi":"स्लीप टाइमर","fr":"Minuterie de sommeil","es":"Temporizador"},"Off":{"hi":"बंद","fr":"Désactivé","es":"Desactivado"},"minutes":{"hi":"मिनट","fr":"minutes","es":"minutos"},"Museum Passport":{"hi":"संग्रहालय पासपोर्ट","fr":"Passeport du musée","es":"Pasaporte del museo"},"Museum progress":{"hi":"संग्रहालय प्रगति","fr":"Progression dans le musée","es":"Progreso del museo"},"ROOM STAMPS":{"hi":"कक्ष मुहरें","fr":"TAMPONS DES SALLES","es":"SELLOS DE SALAS"},"ACHIEVEMENT BADGES":{"hi":"उपलब्धि बैज","fr":"BADGES DE RÉUSSITE","es":"INSIGNIAS DE LOGRO"},"Print Passport":{"hi":"पासपोर्ट प्रिंट करें","fr":"Imprimer le passeport","es":"Imprimir pasaporte"},"Reset Progress":{"hi":"प्रगति रीसेट करें","fr":"Réinitialiser la progression","es":"Restablecer progreso"},"Start typing to search the museum.":{"hi":"संग्रहालय खोजने के लिए लिखना शुरू करें।","fr":"Commencez à taper pour rechercher dans le musée.","es":"Empieza a escribir para buscar en el museo."},"to close":{"hi":"बंद करने के लिए","fr":"pour fermer","es":"para cerrar"},"Official profiles and museum rooms":{"hi":"आधिकारिक प्रोफ़ाइल और संग्रहालय कक्ष","fr":"Profils officiels et salles du musée","es":"Perfiles oficiales y salas del museo"},"FLAG CHALLENGE":{"hi":"झंडा चुनौती","fr":"DÉFI DES DRAPEAUX","es":"DESAFÍO DE BANDERAS"},"Name the Member State":{"hi":"सदस्य देश पहचानें","fr":"Identifiez l’État Membre","es":"Identifica el Estado Miembro"},"Choose the correct country.":{"hi":"सही देश चुनें।","fr":"Choisissez le bon pays.","es":"Elige el país correcto."},"Next Flag":{"hi":"अगला झंडा","fr":"Drapeau suivant","es":"Siguiente bandera"},"FACT OR MYTH":{"hi":"तथ्य या मिथक","fr":"VRAI OU FAUX","es":"HECHO O MITO"},"Test UN Knowledge":{"hi":"UN ज्ञान जाँचें","fr":"Testez vos connaissances sur l’ONU","es":"Pon a prueba tus conocimientos de la ONU"},"FACT":{"hi":"तथ्य","fr":"VRAI","es":"HECHO"},"MYTH":{"hi":"मिथक","fr":"FAUX","es":"MITO"},"Next Statement":{"hi":"अगला कथन","fr":"Énoncé suivant","es":"Siguiente afirmación"},"VISITOR FEEDBACK":{"hi":"आगंतुक प्रतिक्रिया","fr":"AVIS DES VISITEURS","es":"OPINIÓN DE VISITANTES"},"Rate the Digital Museum":{"hi":"डिजिटल संग्रहालय को रेट करें","fr":"Évaluez le musée numérique","es":"Califica el museo digital"},"Save Feedback":{"hi":"प्रतिक्रिया सहेजें","fr":"Enregistrer l’avis","es":"Guardar opinión"},"TEACHER DASHBOARD":{"hi":"शिक्षक डैशबोर्ड","fr":"TABLEAU DE BORD ENSEIGNANT","es":"PANEL DEL DOCENTE"},"Export Exhibition Results":{"hi":"प्रदर्शनी परिणाम निर्यात करें","fr":"Exporter les résultats de l’exposition","es":"Exportar resultados de la exposición"},"Rooms visited":{"hi":"देखे गए कक्ष","fr":"Salles visitées","es":"Salas visitadas"},"Badges earned":{"hi":"प्राप्त बैज","fr":"Badges obtenus","es":"Insignias obtenidas"},"Feedback entries":{"hi":"प्रतिक्रिया प्रविष्टियाँ","fr":"Avis enregistrés","es":"Opiniones guardadas"},"Download CSV Report":{"hi":"CSV रिपोर्ट डाउनलोड करें","fr":"Télécharger le rapport CSV","es":"Descargar informe CSV"},"ACCESSIBILITY":{"hi":"सुगम्यता","fr":"ACCESSIBILITÉ","es":"ACCESIBILIDAD"},"Display Controls":{"hi":"प्रदर्शन नियंत्रण","fr":"Contrôles d’affichage","es":"Controles de visualización"},"Text size":{"hi":"पाठ आकार","fr":"Taille du texte","es":"Tamaño del texto"},"High-contrast mode":{"hi":"उच्च-कॉन्ट्रास्ट मोड","fr":"Mode contraste élevé","es":"Modo de alto contraste"},"Reduce animations":{"hi":"एनिमेशन कम करें","fr":"Réduire les animations","es":"Reducir animaciones"},"Extra-visible keyboard focus":{"hi":"अधिक स्पष्ट कीबोर्ड फ़ोकस","fr":"Focus clavier renforcé","es":"Enfoque de teclado más visible"},"PRESENTER DASHBOARD":{"hi":"प्रस्तुतकर्ता डैशबोर्ड","fr":"TABLEAU DE BORD PRÉSENTATEUR","es":"PANEL DEL PRESENTADOR"},"Exhibition Controls":{"hi":"प्रदर्शनी नियंत्रण","fr":"Contrôles de l’exposition","es":"Controles de la exposición"},"Start presentation":{"hi":"प्रस्तुति शुरू करें","fr":"Commencer la présentation","es":"Iniciar presentación"},"Auto museum tour":{"hi":"स्वचालित संग्रहालय यात्रा","fr":"Visite automatique du musée","es":"Recorrido automático del museo"},"Start kiosk mode":{"hi":"कियोस्क मोड शुरू करें","fr":"Démarrer le mode kiosque","es":"Iniciar modo quiosco"},"Reset activities":{"hi":"गतिविधियाँ रीसेट करें","fr":"Réinitialiser les activités","es":"Restablecer actividades"},"Install app":{"hi":"ऐप इंस्टॉल करें","fr":"Installer l’application","es":"Instalar la aplicación"},"Home":{"hi":"होम","fr":"Accueil","es":"Inicio"},"Explore":{"hi":"खोजें","fr":"Explorer","es":"Explorar"},"Map":{"hi":"मानचित्र","fr":"Carte","es":"Mapa"},"Voting":{"hi":"मतदान","fr":"Vote","es":"Votación"},"Ask":{"hi":"पूछें","fr":"Demander","es":"Preguntar"},"Ask UN Guide":{"hi":"UN मार्गदर्शक से पूछें","fr":"Interroger le guide ONU","es":"Preguntar a la guía de la ONU"},"Smart offline assistant":{"hi":"स्मार्ट ऑफलाइन सहायक","fr":"Assistant intelligent hors ligne","es":"Asistente inteligente sin conexión"},"Ready to help":{"hi":"सहायता के लिए तैयार","fr":"Prêt à aider","es":"Listo para ayudar"},"Official links included":{"hi":"आधिकारिक लिंक शामिल","fr":"Liens officiels inclus","es":"Enlaces oficiales incluidos"},"Previous":{"hi":"पिछला","fr":"Précédent","es":"Anterior"},"Back to top ↑":{"hi":"ऊपर जाएँ ↑","fr":"Retour en haut ↑","es":"Volver arriba ↑"},"Official Website":{"hi":"आधिकारिक वेबसाइट","fr":"Site officiel","es":"Sitio oficial"},"Open official website":{"hi":"आधिकारिक वेबसाइट खोलें","fr":"Ouvrir le site officiel","es":"Abrir sitio oficial"},"Correct!":{"hi":"सही!","fr":"Correct !","es":"¡Correcto!"},"Try again.":{"hi":"फिर प्रयास करें।","fr":"Réessayez.","es":"Inténtalo de nuevo."},"New Challenge":{"hi":"नई चुनौती","fr":"Nouveau défi","es":"Nuevo desafío"},"Completed ✓":{"hi":"पूर्ण ✓","fr":"Terminé ✓","es":"Completado ✓"},"Close":{"hi":"बंद करें","fr":"Fermer","es":"Cerrar"},"Play music":{"hi":"संगीत चलाएँ","fr":"Lire la musique","es":"Reproducir música"},"Pause music":{"hi":"संगीत रोकें","fr":"Mettre la musique en pause","es":"Pausar música"},"Previous track":{"hi":"पिछला ट्रैक","fr":"Piste précédente","es":"Pista anterior"},"Next track":{"hi":"अगला ट्रैक","fr":"Piste suivante","es":"Pista siguiente"},"Language":{"hi":"भाषा","fr":"Langue","es":"Idioma"},"Member States debate and decide, UN bodies coordinate, and agencies and field teams turn agreements into action.":{"hi":"सदस्य देश विचार-विमर्श और निर्णय लेते हैं, संयुक्त राष्ट्र निकाय समन्वय करते हैं तथा एजेंसियाँ और क्षेत्रीय दल समझौतों को कार्य में बदलते हैं।","fr":"Member States debate and decide, UN bodies coordinate, and agencies and field teams turn agreements into action.","es":"Member States debate and decide, UN bodies coordinate, and agencies and field teams turn agreements into action."},"Inside the United Nations":{"hi":"संयुक्त राष्ट्र के अंदर","fr":"Inside the United Nations","es":"Inside the United Nations"}};
const I18N_KEYS=new Set(Object.keys(UI_TRANSLATIONS));
const i18nTextSources=new WeakMap();
const i18nAttributeSources=new WeakMap();
let i18nObserver=null,i18nApplying=false;

function languageLocale(lang=state.lang){return LANGUAGE_META[lang]?.locale||"en-IN";}
function languagePhrase(source,lang=state.lang){
  if(lang==="en")return source;
  const direct=UI_TRANSLATIONS[source]?.[lang];
  if(direct&&direct!==source)return direct;

  let match=source.match(/^Question (\d+) of (\d+)$/);
  if(match){
    if(lang==="hi")return `प्रश्न ${match[1]} / ${match[2]}`;
    if(lang==="fr")return `Question ${match[1]} sur ${match[2]}`;
    if(lang==="es")return `Pregunta ${match[1]} de ${match[2]}`;
  }
  match=source.match(/^Question (\d+)$/);
  if(match){
    if(lang==="hi")return `प्रश्न ${match[1]}`;
    if(lang==="fr")return `Question ${match[1]}`;
    if(lang==="es")return `Pregunta ${match[1]}`;
  }
  match=source.match(/^(\d+) countries$/);
  if(match){
    if(lang==="hi")return `${match[1]} देश`;
    if(lang==="fr")return `${match[1]} pays`;
    if(lang==="es")return `${match[1]} países`;
  }
  match=source.match(/^(\d+) \/ (\d+) rooms$/);
  if(match){
    if(lang==="hi")return `${match[1]} / ${match[2]} कक्ष`;
    if(lang==="fr")return `${match[1]} / ${match[2]} salles`;
    if(lang==="es")return `${match[1]} / ${match[2]} salas`;
  }
  match=source.match(/^(\d+) minutes?$/);
  if(match){
    if(lang==="hi")return `${match[1]} मिनट`;
    if(lang==="fr")return `${match[1]} minutes`;
    if(lang==="es")return `${match[1]} minutos`;
  }
  return source;
}
function i18nKnownEnglish(source){
  return I18N_KEYS.has(source)||
    /^Question \d+(?: of \d+)?$/.test(source)||
    /^\d+ countries$/.test(source)||
    /^\d+ \/ \d+ rooms$/.test(source)||
    /^\d+ minutes?$/.test(source);
}
function translateTextNode(node){
  if(!node||!node.parentElement||/SCRIPT|STYLE|CODE|PRE|TEXTAREA/.test(node.parentElement.tagName))return;
  const raw=node.nodeValue||"",trimmed=raw.trim();
  if(!trimmed)return;
  if(i18nKnownEnglish(trimmed))i18nTextSources.set(node,trimmed);
  const source=i18nTextSources.get(node);
  if(!source)return;
  const translated=languagePhrase(source);
  const lead=raw.match(/^\s*/)?.[0]||"",trail=raw.match(/\s*$/)?.[0]||"";
  const next=lead+translated+trail;
  if(node.nodeValue!==next)node.nodeValue=next;
}
function translateAttributes(element){
  if(!(element instanceof Element))return;
  const attrs=["placeholder","title","aria-label"];
  let store=i18nAttributeSources.get(element);
  if(!store){store={};i18nAttributeSources.set(element,store);}
  attrs.forEach(attr=>{
    const current=element.getAttribute(attr);if(!current)return;
    if(i18nKnownEnglish(current))store[attr]=current;
    const source=store[attr];if(!source)return;
    const translated=languagePhrase(source);
    if(current!==translated)element.setAttribute(attr,translated);
  });
}
function translateSubtree(root=document){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){translateTextNode(root);return;}
  if(root instanceof Element)translateAttributes(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;while((node=walker.nextNode()))translateTextNode(node);
  if(root.querySelectorAll)root.querySelectorAll("*").forEach(translateAttributes);
}
function applyLanguage(lang,announce=false){
  if(!LANGUAGE_META[lang])lang="en";
  state.lang=lang;localStorage.setItem("unMuseumLanguage",lang);
  document.documentElement.lang=lang;document.documentElement.dir="ltr";
  document.body.classList.add("translating");i18nApplying=true;
  translateSubtree(document.body);
  i18nApplying=false;
  requestAnimationFrame(()=>document.body.classList.remove("translating"));
  const meta=LANGUAGE_META[lang];
  $("#languageFlag").textContent=meta.flag;$("#languageCode").textContent=meta.code;
  $$("#languageMenu [data-language]").forEach(button=>button.classList.toggle("active",button.dataset.language===lang));
  updateClocks();
  if(announce){
    const messages={en:"English selected",hi:"हिन्दी चुनी गई",fr:"Français sélectionné",es:"Español seleccionado"};
    toast(messages[lang]);
  }
  document.dispatchEvent(new CustomEvent("museumlanguagechange",{detail:{lang}}));
}
function initLanguage(){
  const button=$("#languageBtn"),menu=$("#languageMenu");
  if(!button||!menu)return;
  const close=()=>{menu.hidden=true;button.setAttribute("aria-expanded","false");};
  button.addEventListener("click",e=>{e.stopPropagation();const open=menu.hidden;menu.hidden=!open;button.setAttribute("aria-expanded",String(open));});
  menu.addEventListener("click",e=>{const option=e.target.closest("[data-language]");if(!option)return;applyLanguage(option.dataset.language,true);close();});
  document.addEventListener("click",e=>{if(!e.target.closest(".language-picker"))close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
  const saved=localStorage.getItem("unMuseumLanguage");
  const browser=(navigator.language||"en").slice(0,2).toLowerCase();
  applyLanguage(LANGUAGE_META[saved]?saved:(LANGUAGE_META[browser]?browser:"en"),false);
  i18nObserver=new MutationObserver(mutations=>{
    if(i18nApplying)return;
    i18nApplying=true;
    mutations.forEach(m=>{
      if(m.type==="characterData")translateTextNode(m.target);
      m.addedNodes.forEach(node=>translateSubtree(node));
      if(m.type==="attributes")translateAttributes(m.target);
    });
    i18nApplying=false;
  });
  i18nObserver.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label"]});
}


const ecoInfo={
  un:["United Nations","A global system where 193 Member States cooperate through the UN Charter."],
  organs:["Principal Organs","The General Assembly, Security Council, ECOSOC, ICJ, Secretariat and Trusteeship Council form the constitutional structure."],
  agencies:["Specialized Agencies","Autonomous organizations linked with the UN work in health, culture, labour, food, aviation, finance and other fields."],
  funds:["Funds & Programmes","Organizations such as UNICEF, UNDP, UNEP, UNHCR and WFP carry out development and humanitarian work."],
  peace:["Peace & Security","Diplomacy, mediation, peacekeeping, peacebuilding and disarmament help prevent and resolve conflict."],
  rights:["Human Rights","UN bodies promote dignity, equality, justice and fundamental freedoms."],
  sdg:["Sustainable Development","The 17 Goals connect poverty, health, education, equality, climate, peace and partnerships."]
};
function initEcosystem(){
  $$(".eco-node,.ecosystem-core").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".eco-node").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    const [title,text]=ecoInfo[btn.dataset.node];
    $("#ecosystemInfo").innerHTML=`<p class="eyebrow">CONNECTED SYSTEM</p><h3>${title}</h3><p>${text}</p>`;
  }));
  const organs=DATA.agencies.filter(a=>a.category==="Principal Organ");
  $("#organGrid").innerHTML=organs.map(a=>`<article class="organ-card reveal">
    <span class="icon">${a.icon}</span><p class="eyebrow">${a.short}</p><h3>${a.name}</h3>
    <p>${a.functions.slice(0,2).join(". ")}.</p><button class="text-link" type="button" data-agency="${a.id}">Explore organ →</button>
  </article>`).join("");
}

const categories=["All","Principal Organ","Humanitarian","Health","Education & Culture","Food","Development","Environment","Human Rights","Finance"];
function initAgencies(){
  $("#agencyFilters").innerHTML=categories.map((c,i)=>`<button type="button" class="${i===0?"active":""}" data-filter="${c}">${c}</button>`).join("");
  $("#agencyFilters").addEventListener("click",e=>{
    const btn=e.target.closest("[data-filter]"); if(!btn) return;
    state.agencyFilter=btn.dataset.filter;
    $$("#agencyFilters button").forEach(x=>x.classList.toggle("active",x===btn));
    renderAgencies();
  });
  $("#agencySearch").addEventListener("input",e=>{state.agencySearch=e.target.value.toLowerCase().trim();renderAgencies();});
  renderAgencies();
}
function renderAgencies(){
  const items=DATA.agencies.filter(a=>{
    const category=state.agencyFilter==="All" || a.category===state.agencyFilter || (state.agencyFilter==="Development" && a.category==="Core System");
    const hay=[a.name,a.short,a.category,a.hq,...a.functions].join(" ").toLowerCase();
    return category && (!state.agencySearch || hay.includes(state.agencySearch));
  });
  $("#agencyGrid").innerHTML=items.map(a=>`<article class="agency-card">
    <div class="agency-top"><span class="agency-icon">${a.icon}</span><img class="agency-qr" src="assets/qr/${a.id}.png" alt="QR code for ${a.name}"></div>
    <span class="category-tag">${a.category.toUpperCase()}</span><h3>${a.short}</h3><p>${a.name}</p><p>${a.hq}</p>
    <button class="text-link" type="button" data-agency="${a.id}">Open profile →</button>
  </article>`).join("");
  $("#agencyEmpty").hidden=items.length>0;
}

function openAgency(id){
  const a=DATA.agencies.find(x=>x.id===id); if(!a) return;
  openModal(`<p class="eyebrow">${a.category}</p><h2 id="modalTitle">${a.icon} ${a.name}</h2>
    <div class="modal-grid">
      <div>
        <p><b>Founded:</b> ${a.year}</p><p><b>Headquarters:</b> ${a.hq}</p><p><b>Leadership:</b> ${a.leader}</p>
        <h3>Main functions</h3><ul>${a.functions.map(x=>`<li>${x}</li>`).join("")}</ul>
        <h3>Major contribution</h3><p>${a.achievement}</p><h3>Current focus</h3><p>${a.project}</p>
        <a class="button primary" href="${a.url}" target="_blank" rel="noopener">Visit Official Website</a>
      </div>
      <div><img class="modal-qr" src="assets/qr/${a.id}.png" alt="Official website QR code"><p>Scan this QR code using a phone camera.</p></div>
    </div>`);
}

const cities=[["New York", 31.1241, 24.7712, "United Nations Headquarters", "General Assembly, Security Council, ECOSOC and the Secretariat are centered here.", "https://www.un.org/", "North America", "-44px", "-44px"], ["Washington, D.C.", 30.1718, 25.8837, "World Bank Group and IMF", "Development finance and international monetary cooperation.", "https://www.worldbank.org/", "North America", "-88px", "18px"], ["The Hague", 51.0212, 17.8837, "International Court of Justice", "The principal judicial organ of the United Nations sits in The Hague.", "https://www.icj-cij.org/", "Europe", "18px", "-43px"], ["Geneva", 51.5182, 21.412, "United Nations Office at Geneva", "Human rights, health, labour, refugees and humanitarian diplomacy.", "https://www.ungeneva.org/", "Europe", "-72px", "-24px"], ["Paris", 50.5715, 19.8072, "UNESCO Headquarters", "Education, science, culture, communication and world heritage.", "https://www.unesco.org/", "Europe", "-66px", "15px"], ["Vienna", 53.9956, 20.1982, "United Nations Office at Vienna", "Nuclear cooperation, drugs and crime, industry and outer space.", "https://www.unov.org/", "Europe", "19px", "-20px"], ["Rome", 53.167, 24.0399, "FAO and WFP", "Food security, agriculture and emergency food assistance.", "https://www.fao.org/", "Europe", "18px", "14px"], ["Nairobi", 60.2272, 50.8011, "United Nations Office at Nairobi", "UNEP and UN-Habitat: environment and sustainable cities.", "https://www.unon.org/", "Africa", "19px", "-15px"]];
function initMap(){
  $("#mapMarkers").innerHTML=cities.map((c,i)=>`<button class="map-marker" type="button"
    style="left:${c[1]}%;top:${c[2]}%;--label-x:${c[7]};--label-y:${c[8]}" data-city="${i}" aria-label="${c[0]}">
    <span class="marker-core"></span><span class="map-label">${c[0]}</span></button>`).join("");
  $("#cityList").innerHTML=cities.map((c,i)=>`<button type="button" data-city="${i}">${c[0]}</button>`).join("");
  $("#map").addEventListener("click",e=>{
    const btn=e.target.closest("[data-city]"); if(!btn) return;
    showCity(Number(btn.dataset.city));
  });
  showCity(0);
}
function showCity(index){
  const c=cities[index]; if(!c) return;
  $$(".map-marker").forEach(x=>x.classList.toggle("active",Number(x.dataset.city)===index));
  $("#cityPanel").innerHTML=`<p class="eyebrow">${c[0]}</p><h3>${c[3]}</h3><span class="city-subtitle">${c[6]}</span><p>${c[4]}</p>
  <a class="button primary small" href="${c[5]}" target="_blank" rel="noopener">Official Website</a>
  <div class="city-list">${cities.map((x,i)=>`<button type="button" data-city="${i}" class="${i===index?'active':''}">${x[0]}</button>`).join("")}</div>
  <small class="map-note">Robinson projection • Markers use geographic coordinates</small>`;
}

function initPeace(){
  $("#missionGrid").innerHTML=DATA.missions.map((m,i)=>`<article class="mission-card">
    <small>MISSION ${String(i+1).padStart(2,"0")}</small><h3>${m.code}</h3><p>${m.place}</p>
    <button class="text-link" type="button" data-mission="${i}">Mission focus →</button>
  </article>`).join("");
  $("#missionGrid").addEventListener("click",e=>{
    const btn=e.target.closest("[data-mission]"); if(!btn) return;
    const m=DATA.missions[Number(btn.dataset.mission)];
    openModal(`<div class="modal-hero">🕊️</div><p class="eyebrow">CURRENT PEACEKEEPING OPERATION</p>
      <h2 id="modalTitle">${m.code} • ${m.place}</h2><p>${m.focus}</p>
      <a class="button primary" href="https://peacekeeping.un.org/en/where-we-operate" target="_blank" rel="noopener">Official Missions Page</a>`);
  });
}

function initSDGs(){
  $("#sdgGrid").innerHTML=DATA.sdgs.map((s,i)=>`<button class="sdg-card" type="button" style="background:${s[1]}" data-sdg="${i}">
    <b>${i+1}</b><span>${s[0]}</span></button>`).join("");
  $("#sdgGrid").addEventListener("click",e=>{
    const btn=e.target.closest("[data-sdg]"); if(!btn) return;
    showSDG(Number(btn.dataset.sdg));
  });
  showSDG(0);
}
function showSDG(index){
  const s=DATA.sdgs[index]; if(!s) return;
  $$(".sdg-card").forEach(x=>x.classList.toggle("active",Number(x.dataset.sdg)===index));
  const value=48+(index*7)%42;
  $("#sdgDetail").innerHTML=`<div class="sdg-number">${index+1}</div><p class="eyebrow">GOAL ${index+1}</p>
    <h3>${s[0]}</h3><p>${s[2]}</p><p><b>Real-world example:</b> ${s[3]}</p>
    <div class="goal-meter"><span style="width:${value}%"></span></div><small>Illustrative exhibition indicator</small>
    <p><a class="text-link" href="https://sdgs.un.org/goals/goal${index+1}" target="_blank" rel="noopener">Open official goal page →</a></p>`;
}

const councilMembers=[
 ["China",true],["France",true],["Russian Federation",true],["United Kingdom",true],["United States",true],
 ["Bahrain",false],["Colombia",false],["Democratic Republic of the Congo",false],["Denmark",false],["Greece",false],
 ["Latvia",false],["Liberia",false],["Pakistan",false],["Panama",false],["Somalia",false]
];
function initSimulators(){
  $$(".sim-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".sim-tabs button").forEach(x=>x.classList.toggle("active",x===btn));
    $$(".sim-panel").forEach(panel=>panel.hidden=panel.id!==btn.dataset.sim);
  }));
  renderCouncil();
  $("#resetCouncil").addEventListener("click",()=>{state.councilVotes={};renderCouncil();});
  $("#autoVote").addEventListener("click",()=>applyVotes(["Y","Y","A","Y","Y","Y","Y","Y","Y","A","Y","Y","Y","A","Y"]));
  $("#vetoDemo").addEventListener("click",()=>applyVotes(["N","Y","Y","Y","Y","Y","Y","Y","Y","Y","Y","Y","Y","A","A"]));

  initGeneralAssemblyVoting();

  const crises=[
    ["Earthquake","🌍",["OCHA assesses needs","WHO coordinates health care","UNICEF restores water and child services","WFP delivers food and logistics","UNDP supports recovery"]],
    ["Flood","🌊",["OCHA coordinates responders","UNICEF supports clean water","WHO prevents disease outbreaks","WFP provides food and logistics","UN-Habitat supports shelter"]],
    ["Conflict","🕊️",["Diplomacy and mediation begin","UNHCR protects displaced people","WFP supplies food","UNICEF protects children","Peacebuilding supports recovery"]],
    ["Pandemic","🦠",["WHO leads the health response","UNICEF shares public information","WFP supports logistics","UNDP supports recovery","Countries coordinate through the UN"]],
    ["Refugee Crisis","🏕️",["UNHCR registers and protects people","WFP provides food","UNICEF supports children","WHO supports health services","Partners support safe solutions"]]
  ];
  $("#crisisChoices").innerHTML=crises.map((c,i)=>`<button type="button" data-crisis="${i}">${c[1]} ${c[0]}</button>`).join("");
  $("#crisisChoices").addEventListener("click",e=>{
    const btn=e.target.closest("[data-crisis]"); if(!btn) return;
    $$("#crisisChoices button").forEach(x=>x.classList.toggle("active",x===btn));
    const c=crises[Number(btn.dataset.crisis)];
    $("#crisisResult").innerHTML=`<span class="crisis-symbol">${c[1]}</span><div><p class="eyebrow">${c[0]}</p><h3>Coordinated UN response</h3>
      <div class="response-chain">${c[2].map((x,i)=>`<span>${i+1}. ${x}</span>${i<c[2].length-1?"<i>→</i>":""}`).join("")}</div></div>`;
  });
}


function initGeneralAssemblyVoting(){
  state.gaVotes={};
  state.gaClosed=false;
  state.gaSelectedCountry=UN_COUNTRIES.find(c=>c.name==="India")?.name||UN_COUNTRIES[0].name;
  renderGACountryOptions();
  renderGeneralAssembly();

  $("#gaRule").addEventListener("change",()=>{
    state.gaClosed=false;updateGARuleText();updateGADashboard();
  });
  $("#gaRegionFilter").addEventListener("change",()=>renderGASeats());
  $("#gaCountrySearch").addEventListener("input",()=>renderGACountryOptions());
  $("#gaCountrySelect").addEventListener("change",e=>{
    state.gaSelectedCountry=e.target.value;updateSelectedDelegate();
  });
  $("#gaCastYes").addEventListener("click",()=>castNamedGAVote("Y"));
  $("#gaCastNo").addEventListener("click",()=>castNamedGAVote("N"));
  $("#gaCastAbstain").addEventListener("click",()=>castNamedGAVote("A"));
  $("#gaReset").addEventListener("click",()=>{
    state.gaVotes={};state.gaClosed=false;renderGeneralAssembly();toast("General Assembly hall reset.");
  });
  $("#gaPassDemo").addEventListener("click",()=>fillGADemo(true));
  $("#gaRejectDemo").addEventListener("click",()=>fillGADemo(false));
  $("#gaCloseVote").addEventListener("click",()=>{
    state.gaClosed=true;updateGADashboard();toast("General Assembly voting closed.");
  });
  $("#gaDownloadReport").addEventListener("click",downloadGAVoteReport);
  $("#gaPrintReport").addEventListener("click",printGAVoteReport);
}
function renderGACountryOptions(){
  const search=$("#gaCountrySearch").value.trim().toLowerCase();
  const region=$("#gaRegionFilter")?.value||"All";
  const list=UN_COUNTRIES.filter(c=>(region==="All"||c.region===region)&&(!search||`${c.name} ${c.code} ${c.region}`.toLowerCase().includes(search)));
  $("#gaCountrySelect").innerHTML=list.map(c=>`<option value="${escapeHTML(c.name)}" ${c.name===state.gaSelectedCountry?"selected":""}>${c.flag} ${c.name}${state.gaVotes[c.name]?` — ${voteLabel(state.gaVotes[c.name])}`:""}</option>`).join("");
  if(!list.some(c=>c.name===state.gaSelectedCountry) && list.length)state.gaSelectedCountry=list[0].name;
  updateSelectedDelegate();
}
function updateSelectedDelegate(){
  const country=UN_COUNTRIES.find(c=>c.name===state.gaSelectedCountry);
  if(!country)return;
  const vote=state.gaVotes[country.name];
  $("#gaSelectedDelegate").innerHTML=`<span>${country.flag}</span><div><small>SELECTED DELEGATE • ${country.region}</small><strong>${country.name}</strong>${vote?`<em>Current vote: ${voteLabel(vote)}</em>`:""}</div>`;
}
function castNamedGAVote(choice){
  if(state.gaClosed){toast("Reset or reopen the hall to change the vote.");return;}
  const country=state.gaSelectedCountry;
  if(!country){toast("Select a Member State first.");return;}
  state.gaVotes[country]=choice;
  renderGeneralAssembly(country);
}
function voteLabel(choice){return choice==="Y"?"Yes":choice==="N"?"No":"Abstain";}
function fillGADemo(adopted){
  state.gaVotes={};
  const rule=$("#gaRule").value;
  UN_COUNTRIES.forEach((country,index)=>{
    let vote;
    if(adopted){
      vote=rule==="twoThirds"?(index<130?"Y":index<169?"N":"A"):(index<105?"Y":index<171?"N":"A");
    }else{
      vote=rule==="twoThirds"?(index<105?"Y":index<171?"N":"A"):(index<79?"Y":index<171?"N":"A");
    }
    state.gaVotes[country.name]=vote;
  });
  state.gaClosed=true;
  renderGeneralAssembly();
}
function renderGeneralAssembly(highlightCountry=""){
  renderGACountryOptions();
  renderGASeats(highlightCountry);
  updateGARuleText();
  updateGADashboard();
  renderGAVoteTable();
}
function renderGASeats(highlightCountry=""){
  const filter=$("#gaRegionFilter")?.value||"All";
  $("#gaSeatGrid").innerHTML=UN_COUNTRIES.map(country=>{
    const vote=state.gaVotes[country.name]||"";
    const filtered=filter!=="All"&&country.region!==filter;
    return `<button type="button" class="ga-seat ${vote?`vote-${vote}`:""} ${country.name===highlightCountry?"just-voted":""} ${filtered?"filtered-out":""}"
      data-ga-country="${escapeHTML(country.name)}" title="${escapeHTML(country.name)} • ${country.region} • ${vote?voteLabel(vote):"Not recorded"}"
      aria-label="${escapeHTML(country.name)}: ${vote?voteLabel(vote):"Not recorded"}"><span>${country.flag}</span></button>`;
  }).join("");
  $$("#gaSeatGrid [data-ga-country]").forEach(btn=>btn.addEventListener("click",()=>{
    state.gaSelectedCountry=btn.dataset.gaCountry;
    renderGACountryOptions();
    $("#gaCountrySelect").value=state.gaSelectedCountry;
    $("#gaCountrySelect").scrollIntoView({behavior:"smooth",block:"nearest"});
  }));
}
function updateGARuleText(){
  const rule=$("#gaRule")?.value||"simple";
  $("#gaRuleExplainer").textContent=rule==="twoThirds"
    ?"Important questions require a two-thirds majority of members present and voting."
    :"Other questions require a simple majority of members present and voting.";
}
function updateGADashboard(){
  const values=Object.values(state.gaVotes);
  const yes=values.filter(v=>v==="Y").length,no=values.filter(v=>v==="N").length,abstain=values.filter(v=>v==="A").length;
  const pending=193-values.length,presentVoting=yes+no,rule=$("#gaRule")?.value||"simple";
  const threshold=presentVoting===0?0:(rule==="twoThirds"?Math.ceil(presentVoting*2/3):Math.floor(presentVoting/2)+1);
  $("#gaYesCount").textContent=yes;$("#gaNoCount").textContent=no;$("#gaAbstainCount").textContent=abstain;$("#gaPendingCount").textContent=pending;
  $("#gaThreshold").textContent=presentVoting?threshold:"—";$("#gaPresentVoting").textContent=`Present and voting: ${presentVoting}`;
  $("#gaRemainingText").textContent=pending===0?"All 193 Member States have recorded a vote.":`${pending} Member State${pending===1?"":"s"} have not voted.`;
  const decision=$("#gaDecision");decision.classList.remove("adopted","rejected");
  if(!state.gaClosed){
    decision.innerHTML=`<span class="ga-decision-light"></span><div><strong>Voting in progress</strong><p>${presentVoting?`Current requirement: ${threshold} Yes votes.`:"Select countries and record their votes."}</p></div>`;
  }else if(!presentVoting){
    decision.classList.add("rejected");decision.innerHTML=`<span class="ga-decision-light"></span><div><strong>NO DECISION</strong><p>No members were present and voting.</p></div>`;
  }else{
    const adopted=yes>=threshold;decision.classList.add(adopted?"adopted":"rejected");
    decision.innerHTML=`<span class="ga-decision-light"></span><div><strong>${adopted?"RESOLUTION ADOPTED":"RESOLUTION NOT ADOPTED"}</strong><p>${yes} Yes, ${no} No, ${abstain} Abstain. ${threshold} Yes votes were required.</p></div>`;
  }
  renderGARegionSummary();
}
function renderGAVoteTable(){
  const records=UN_COUNTRIES.filter(c=>state.gaVotes[c.name]).sort((a,b)=>a.name.localeCompare(b.name));
  $("#gaVoteTable").innerHTML=records.length?records.map(c=>`<tr><td>${c.flag} ${escapeHTML(c.name)}</td><td>${c.region}</td><td><span class="vote-pill ${state.gaVotes[c.name]}">${voteLabel(state.gaVotes[c.name])}</span></td></tr>`).join(""):`<tr><td colspan="3">No votes recorded yet.</td></tr>`;
}
function renderGARegionSummary(){
  const regions=["Africa","Americas","Asia","Europe","Oceania"];
  $("#gaRegionSummary").innerHTML=regions.map(region=>{
    const countries=UN_COUNTRIES.filter(c=>c.region===region),votes=countries.map(c=>state.gaVotes[c.name]).filter(Boolean);
    const y=votes.filter(v=>v==="Y").length,n=votes.filter(v=>v==="N").length,a=votes.filter(v=>v==="A").length;
    return `<article class="ga-region-chip"><b>${region}</b><span>${y} Yes • ${n} No • ${a} Abstain</span></article>`;
  }).join("");
}
function gaCSV(){
  const rows=[["Member State","ISO Code","Display Region","Vote"]];
  UN_COUNTRIES.forEach(c=>rows.push([c.name,c.code,c.region,state.gaVotes[c.name]?voteLabel(state.gaVotes[c.name]):"Not recorded"]));
  return rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
}
function downloadGAVoteReport(){
  const blob=new Blob([gaCSV()],{type:"text/csv;charset=utf-8"});
  const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="UN_General_Assembly_Vote_Report.csv";link.click();URL.revokeObjectURL(link.href);
}
function printGAVoteReport(){
  const yes=Object.values(state.gaVotes).filter(v=>v==="Y").length,no=Object.values(state.gaVotes).filter(v=>v==="N").length,abstain=Object.values(state.gaVotes).filter(v=>v==="A").length;
  const win=open("","_blank");if(!win){toast("Allow pop-ups to print the report.");return;}
  const rows=UN_COUNTRIES.filter(c=>state.gaVotes[c.name]).map(c=>`<tr><td>${c.flag} ${escapeHTML(c.name)}</td><td>${c.region}</td><td>${voteLabel(state.gaVotes[c.name])}</td></tr>`).join("");
  win.document.write(`<html><head><title>General Assembly Vote Report</title><style>body{font-family:Arial;padding:35px}h1{color:#0077a8}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:7px;text-align:left}</style></head><body><h1>United Nations General Assembly — Exhibition Vote Report</h1><p><b>Result:</b> ${yes} Yes • ${no} No • ${abstain} Abstain</p><table><thead><tr><th>Member State</th><th>Region</th><th>Vote</th></tr></thead><tbody>${rows}</tbody></table><script>onload=()=>print()<\/script></body></html>`);win.document.close();
}

function renderCouncil(){
  $("#councilBoard").innerHTML=councilMembers.map(([name,p],i)=>`<article class="country-seat ${p?"permanent":""}">
    <small>${p?"PERMANENT MEMBER":"ELECTED MEMBER"}</small><b>${name}</b>
    <div class="seat-buttons">
      <button class="yes ${state.councilVotes[i]==="Y"?"active":""}" type="button" data-seat="${i}" data-choice="Y">YES</button>
      <button class="no ${state.councilVotes[i]==="N"?"active":""}" type="button" data-seat="${i}" data-choice="N">NO</button>
      <button class="abs ${state.councilVotes[i]==="A"?"active":""}" type="button" data-seat="${i}" data-choice="A">ABS</button>
    </div></article>`).join("");
  $("#councilBoard").onclick=e=>{
    const btn=e.target.closest("[data-seat]"); if(!btn) return;
    state.councilVotes[Number(btn.dataset.seat)]=btn.dataset.choice;
    renderCouncil(); updateCouncilSummary();
  };
  updateCouncilSummary();
}
function applyVotes(values){state.councilVotes={};values.forEach((v,i)=>state.councilVotes[i]=v);renderCouncil();}
function updateCouncilSummary(){
  const values=Object.values(state.councilVotes);
  const yes=values.filter(x=>x==="Y").length,no=values.filter(x=>x==="N").length,abs=values.filter(x=>x==="A").length;
  $("#yesCount").textContent=yes;$("#noCount").textContent=no;$("#abstainCount").textContent=abs;
  const veto=councilMembers.some((m,i)=>m[1]&&state.councilVotes[i]==="N");
  const decision=$("#councilDecision");
  if(veto){decision.innerHTML="<strong>NOT ADOPTED — VETO</strong><span>A permanent member voted No.</span>";decision.style.borderColor="#ff6673";}
  else if(yes>=9){decision.innerHTML="<strong>RESOLUTION ADOPTED</strong><span>At least nine Yes votes and no permanent-member veto.</span>";decision.style.borderColor="#38d983";}
  else if(values.length===15){decision.innerHTML="<strong>NOT ADOPTED</strong><span>Fewer than nine members voted Yes.</span>";decision.style.borderColor="#ffd166";}
  else{decision.innerHTML="<strong>Voting in progress</strong><span>At least nine Yes votes are required.</span>";decision.style.borderColor="var(--line)";}
}

const galleryItems=[
 ["unhq","assets/photos/un_headquarters.jpg","United Nations Headquarters","The Secretariat Building and UN complex in New York.","Padraic Ryan • Wikimedia Commons","https://www.un.org/"],
 ["ga","assets/photos/general_assembly.jpg","General Assembly Hall","The universal meeting hall where all Member States participate.","Basil D Soufi • CC BY-SA 3.0","https://www.un.org/en/ga/"],
 ["sc","assets/photos/security_council.jpg","Security Council Chamber","The chamber responsible for international peace and security.","Patrick Gruban • CC BY-SA 2.0","https://www.un.org/securitycouncil/"],
 ["icj","assets/photos/icj.jpg","Peace Palace and ICJ","The seat of the International Court of Justice in The Hague.","International Court of Justice • Public domain","https://www.icj-cij.org/"],
 ["unicef","assets/photos/unicef_aid.jpg","UNICEF Humanitarian Assistance","Supplies supporting children affected by crisis.","UNICEF Ukraine/A. Krepkih • CC BY 2.0","https://www.unicef.org/"],
 ["who","assets/photos/who_hq.jpg","WHO Headquarters","The World Health Organization headquarters in Geneva.","Yann Forget • Wikimedia Commons • CC BY-SA","https://www.who.int/"]
];
function initGallery(){
  $("#galleryGrid").innerHTML=galleryItems.map((g,i)=>`<article class="gallery-card photo-gallery-card">
    <button type="button" data-gallery="${i}" aria-label="Open ${g[2]}"><img class="gallery-photo" src="${g[1]}" alt="${g[2]}" loading="lazy"></button>
    <div class="gallery-caption"><small>PHOTO ROOM ${String(i+1).padStart(2,"0")}</small><h3>${g[2]}</h3><p>${g[3]}</p><p class="gallery-credit">${g[4]}</p></div>
  </article>`).join("");
  $("#galleryGrid").addEventListener("click",e=>{
    const btn=e.target.closest("[data-gallery]");if(!btn)return;
    const g=galleryItems[Number(btn.dataset.gallery)];
    openModal(`<img class="modal-photo" src="${g[1]}" alt="${g[2]}"><p class="eyebrow">OFFLINE PHOTO MUSEUM</p><h2 id="modalTitle">${g[2]}</h2><p>${g[3]}</p>
      <a class="button primary" href="${g[5]}" target="_blank" rel="noopener">Official Learning Page</a><div class="photo-credit-box"><b>Credit:</b> ${g[4]}</div>`);
  });
}

const quizSets={
 easy:[["How many UN Member States are there?",["193","150","205","120"],0],["Which organ includes every Member State?",["ICJ","General Assembly","Security Council","Secretariat"],1],["How many SDGs are there?",["10","12","17","25"],2],["What colour identifies UN peacekeepers?",["Blue","Red","Black","Orange"],0],["Where is the main UN headquarters?",["Paris","Rome","New York","Nairobi"],2]],
 medium:[["How many members are in the Security Council?",["10","15","20","25"],1],["Where is the ICJ located?",["Geneva","The Hague","Vienna","Paris"],1],["Which organization protects children?",["WHO","UNICEF","IMF","FAO"],1],["Which agency leads global health?",["UNESCO","WHO","UNDP","WFP"],1],["When were the SDGs adopted?",["2000","2008","2015","2022"],2]],
 hard:[["How many permanent Security Council members are there?",["3","5","7","10"],1],["Which body coordinates economic and social work?",["ECOSOC","ICJ","UNHCR","WHO"],0],["What treaty founded the UN?",["Paris Agreement","UN Charter","Rome Statute","Geneva Protocol"],1],["Which organ performs daily UN work?",["Secretariat","General Assembly","ICJ","Trusteeship Council"],0],["Which city hosts UNEP headquarters?",["Paris","Rome","Nairobi","New York"],2]]
};
function initLearning(){
  $("#difficultyButtons").className="difficulty-buttons";
  $("#difficultyButtons").innerHTML=["easy","medium","hard"].map((x,i)=>`<button type="button" data-level="${x}" class="${i===0?"active":""}">${x[0].toUpperCase()+x.slice(1)}</button>`).join("");
  $("#difficultyButtons").addEventListener("click",e=>{
    const btn=e.target.closest("[data-level]");if(!btn)return;
    state.quizLevel=btn.dataset.level;state.quizIndex=0;state.quizScore=0;state.quizLocked=false;
    $$("#difficultyButtons button").forEach(x=>x.classList.toggle("active",x===btn));renderQuestion();
  });
  $("#quizNext").addEventListener("click",()=>{
    const set=quizSets[state.quizLevel];
    if(state.quizIndex>=set.length){state.quizIndex=0;state.quizScore=0;}else state.quizIndex++;
    renderQuestion();
  });
  renderQuestion();

  const promptTexts=["What is the UN?","What is veto power?","Explain the SDGs"];
  $("#quickPrompts").innerHTML=promptTexts.map(x=>`<button type="button">${x}</button>`).join("");
  $("#quickPrompts").addEventListener("click",e=>{if(e.target.tagName==="BUTTON")addChat(e.target.textContent);});
  $("#chatForm").addEventListener("submit",e=>{e.preventDefault();const input=$("#chatInput");const q=input.value.trim();if(q){addChat(q);input.value="";}});
  initAgencyGame();
  $("#certificateBtn").addEventListener("click",createCertificate);
}
function renderQuestion(){
  const set=quizSets[state.quizLevel];
  if(state.quizIndex>=set.length){
    $("#quizQuestion").textContent=`Challenge complete — ${state.quizScore}/${set.length}`;
    $("#quizAnswers").innerHTML=`<p>${state.quizScore===set.length?"Outstanding! You are a UN Champion.":"Good work. Review the museum and try again."}</p>`;
    $("#quizMeta").textContent="Completed";$("#quizProgress").style.width="100%";$("#quizNext").disabled=false;$("#quizNext").textContent="Restart";return;
  }
  state.quizLocked=false;$("#quizNext").disabled=true;$("#quizNext").textContent="Next";
  const q=set[state.quizIndex];
  $("#quizMeta").textContent=`Question ${state.quizIndex+1} of ${set.length} • Score ${state.quizScore}`;
  $("#quizProgress").style.width=`${state.quizIndex/set.length*100}%`;
  $("#quizQuestion").textContent=q[0];
  $("#quizAnswers").innerHTML=q[1].map((a,i)=>`<button type="button" data-answer="${i}">${a}</button>`).join("");
  $("#quizAnswers").onclick=e=>{
    const btn=e.target.closest("[data-answer]");if(!btn||state.quizLocked)return;
    state.quizLocked=true;
    $$("#quizAnswers button").forEach(x=>{x.disabled=true;if(Number(x.dataset.answer)===q[2])x.classList.add("correct");});
    if(Number(btn.dataset.answer)===q[2])state.quizScore++;else btn.classList.add("wrong");
    $("#quizNext").disabled=false;
  };
}
const assistantContext={entityId:null,lastAnswer:"",lastLink:""};
const assistantAliases={
 un:["united nations","the un","uno"],
 ga:["general assembly","unga"],
 sc:["security council","unsc"],
 ecosoc:["ecosoc","economic and social council"],
 icj:["international court of justice","world court","icj"],
 secretariat:["un secretariat","secretariat"],
 trusteeship:["trusteeship council"],
 who:["world health organization","who"],
 unicef:["unicef","children's fund","childrens fund"],
 unesco:["unesco"],
 fao:["food and agriculture organization","fao"],
 undp:["united nations development programme","united nations development program","undp"],
 unep:["united nations environment programme","united nations environment program","unep"],
 unhcr:["un refugee agency","refugee agency","unhcr"],
 wfp:["world food programme","world food program","wfp"],
 unwomen:["un women"],
 unhabitat:["un-habitat","un habitat"],
 worldbank:["world bank"],
 imf:["international monetary fund","imf"]
};
function normalizeAssistantText(text){return text.toLowerCase().replace(/[?.,!'"()]/g," ").replace(/\s+/g," ").trim();}
function assistantAliasMatches(question,normalized,alias,id){
  const clean=normalizeAssistantText(alias);
  if(!clean)return false;
  if(id==="who" && clean==="who"){
    return /\bWHO\b/.test(question) ||
      /(?:what does|tell me about|about|headquarters of|role of|function of)\s+who\b/i.test(question) ||
      /\bwho\s+(?:agency|organization|organisation|health|headquarters|director)\b/i.test(question);
  }
  const escaped=clean.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\s+/g,"\\s+");
  return new RegExp(`(?:^|\\b)${escaped}(?=\\b|$)`,"i").test(normalized);
}
function findAssistantEntities(question){
  const q=normalizeAssistantText(question),found=[];
  for(const [id,aliases] of Object.entries(assistantAliases)){
    const agency=DATA.agencies.find(a=>a.id===id);
    const all=[...(aliases||[]),agency?.name,agency?.short].filter(Boolean);
    if(all.some(alias=>assistantAliasMatches(question,q,alias,id)))found.push(agency);
  }
  return [...new Map(found.filter(Boolean).map(x=>[x.id,x])).values()];
}
function assistantLanguage(question){
  if(/[\u0900-\u097F]/.test(question))return"hi";
  if(/[¿¡ñáéíóúü]/i.test(question)||/\b(qué|dónde|cuándo|hola|agencia|objetivo|paz)\b/i.test(question))return"es";
  if(/[àâçéèêëîïôùûüÿœ]/i.test(question)||/\b(quoi|où|quand|bonjour|agence|objectif|paix)\b/i.test(question))return"fr";
  return state.lang;
}
function assistantIsHindi(question){return assistantLanguage(question)==="hi";}
function agencyAnswer(agency,question,hindi=false){
  const q=normalizeAssistantText(question);
  assistantContext.entityId=agency.id;
  let text,link=null;
  if(/headquarter|where.*(based|located)|location|मुख्यालय|कहाँ/.test(q)){
    text=hindi?`${agency.name} का मुख्यालय ${agency.hq} में है।`:`${agency.name} is headquartered in ${agency.hq}.`;
  }else if(/founded|established|created|year|स्थापना|कब/.test(q)){
    text=hindi?`${agency.name} की स्थापना ${agency.year} में हुई थी।`:`${agency.name} was established in ${agency.year}.`;
  }else if(/leader|director|secretary.general|head of|नेता|निदेशक|महासचिव/.test(q)){
    text=hindi?`${agency.name} का वर्तमान नेतृत्व: ${agency.leader}.`:`Current leadership for ${agency.name}: ${agency.leader}.`;
  }else if(/function|role|what.*do|work|purpose|कार्य|भूमिका|क्या करता/.test(q)){
    text=hindi?`${agency.name} के मुख्य कार्य हैं: ${agency.functions.join("; ")}।`:`${agency.name} mainly works to ${agency.functions.map(x=>x.toLowerCase()).join("; ")}.`;
  }else if(/achievement|success|contribution|उपलब्धि|योगदान/.test(q)){
    text=hindi?`${agency.name} का प्रमुख योगदान: ${agency.achievement}`:`A major contribution of ${agency.name}: ${agency.achievement}`;
  }else if(/project|current focus|focus|programme|program|परियोजना|वर्तमान कार्य/.test(q)){
    text=hindi?`${agency.name} का वर्तमान कार्य-क्षेत्र: ${agency.project}`:`The current focus of ${agency.name} includes ${agency.project}`;
  }else if(/official|website|link|qr|वेबसाइट|लिंक/.test(q)){
    text=hindi?`${agency.name} की आधिकारिक वेबसाइट नीचे उपलब्ध है।`:`Here is the official website for ${agency.name}.`;link=agency.url;
  }else{
    text=hindi
      ?`${agency.name} (${agency.short}) की स्थापना ${agency.year} में हुई थी और इसका मुख्यालय ${agency.hq} में है। इसके मुख्य कार्य हैं: ${agency.functions.join("; ")}।`
      :`${agency.name} (${agency.short}) was established in ${agency.year} and is headquartered in ${agency.hq}. Its main work includes ${agency.functions.map(x=>x.toLowerCase()).join("; ")}.`;
  }
  return{text,link,linkLabel:hindi?"आधिकारिक वेबसाइट खोलें":"Open official website",topic:agency.short};
}
function sdgAnswer(question,hindi=false){
  const q=normalizeAssistantText(question);
  let index=null;
  const number=q.match(/(?:sdg|goal|लक्ष्य)\s*(\d{1,2})/);
  if(number)index=Number(number[1])-1;
  if(index===null||index<0||index>=DATA.sdgs.length){
    index=DATA.sdgs.findIndex(s=>q.includes(s[0].toLowerCase()));
  }
  if(index>=0){
    const s=DATA.sdgs[index];
    return{
      text:hindi?`SDG ${index+1} — ${s[0]}: ${s[2]} उदाहरण: ${s[3]}`:`SDG ${index+1} — ${s[0]}: ${s[2]} Example: ${s[3]}`,
      link:`https://sdgs.un.org/goals/goal${index+1}`,linkLabel:hindi?"आधिकारिक लक्ष्य पृष्ठ":"Official goal page",topic:`SDG ${index+1}`
    };
  }
  return{
    text:hindi?"17 सतत विकास लक्ष्य गरीबी, भूख, स्वास्थ्य, शिक्षा, समानता, जल, ऊर्जा, जलवायु, शांति और वैश्विक साझेदारी को जोड़ते हैं। इन्हें 2015 में 2030 एजेंडा के भाग के रूप में अपनाया गया था।":"The 17 Sustainable Development Goals connect poverty, hunger, health, education, equality, water, energy, climate, peace and global partnerships. They were adopted in 2015 as part of the 2030 Agenda.",
    link:"https://sdgs.un.org/goals",linkLabel:hindi?"सभी लक्ष्य देखें":"View all official goals",navigate:"#sdgs",topic:"SDGs"
  };
}
function missionAnswer(question,hindi=false){
  const q=normalizeAssistantText(question);
  const mission=DATA.missions.find(m=>q.includes(m.code.toLowerCase())||q.includes(m.place.toLowerCase()));
  if(mission){
    return{text:hindi?`${mission.code} ${mission.place} में कार्यरत संयुक्त राष्ट्र शांति मिशन है। इसका मुख्य कार्य: ${mission.focus}`:`${mission.code} is a UN peacekeeping mission in ${mission.place}. Its focus is: ${mission.focus}`,link:"https://peacekeeping.un.org/en/where-we-operate",linkLabel:hindi?"आधिकारिक मिशन सूची":"Official missions list",topic:mission.code};
  }
  return{text:hindi?"वर्तमान में 11 संयुक्त राष्ट्र शांति मिशन हैं। इनमें सैन्य, पुलिस और नागरिक कर्मी नागरिकों की सुरक्षा, युद्धविराम और स्थायी शांति का समर्थन करते हैं।":"There are currently 11 UN peacekeeping missions. Military, police and civilian personnel support civilian protection, ceasefires and sustainable peace.",link:"https://peacekeeping.un.org/en/where-we-operate",linkLabel:hindi?"मिशन मानचित्र खोलें":"Open official mission map",navigate:"#peace",topic:"Peacekeeping"};
}
function navigationAnswer(question,hindi=false){
  const q=normalizeAssistantText(question);
  const targets=[
    [["agency","agencies","organization","एजेंसी"],"#agencies","Agency Explorer","एजेंसी अन्वेषक"],
    [["sdg","goals","सतत","लक्ष्य"],"#sdgs","SDG Gallery","SDG गैलरी"],
    [["peacekeeping","missions","शांति"],"#peace","Peacekeeping Centre","शांति स्थापना केंद्र"],
    [["country explorer","member states","countries","देश"],"#countries","Country Explorer","देश अन्वेषक"],
    [["funding","budget","allocation","वित्त"],"#funding","Funding Lab","वित्त प्रयोगशाला"],
    [["international days","un day","observances","अंतरराष्ट्रीय दिवस"],"#international-days","International Days Calendar","अंतरराष्ट्रीय दिवस कैलेंडर"],
    [["situation room","global crisis","problem solver"],"#situation-room","Global Situation Room","वैश्विक स्थिति कक्ष"],
    [["resolution builder","draft resolution","clauses"],"#resolution-builder","Resolution Builder","प्रस्ताव निर्माण"],
    [["un careers","career explorer","jobs"],"#careers","UN Careers Explorer","UN करियर अन्वेषक"],
    [["chamber tour","general assembly hall","security council chamber"],"#chamber-tour","Chamber Hotspot Tour","कक्ष भ्रमण"],
    [["treaty","diplomacy","negotiation","समझौता"],"#diplomacy-lab","Diplomacy Lab","कूटनीति प्रयोगशाला"],
    [["model un","mun","delegate speech"],"#simulators","Model UN Challenge","मॉडल UN चुनौती"],
    [["map","headquarters","location","मानचित्र","मुख्यालय"],"#map","World Map","विश्व मानचित्र"],
    [["general assembly voting","assembly vote","unga voting","महासभा मतदान"],"#simulators","General Assembly Voting Hall","महासभा मतदान कक्ष"],
    [["voting","simulator","veto","vote","मतदान"],"#simulators","Decision Simulators","निर्णय सिमुलेटर"],
    [["quiz","learning","game","प्रश्नोत्तरी","खेल"],"#learning","Learning Lab","अध्ययन प्रयोगशाला"],
    [["ecosystem","system","पारिस्थितिकी"],"#ecosystem","UN Ecosystem","UN पारिस्थितिकी"],
    [["history","timeline","इतिहास"],"#history","History Museum","इतिहास संग्रहालय"]
  ];
  if(!/(show|open|take me|go to|navigate|दिखाओ|खोलो|ले चलो)/.test(q))return null;
  for(const [words,selector,en,hi] of targets){
    if(words.some(w=>q.includes(w)))return{text:hindi?`मैं ${hi} खोल रहा हूँ।`:`I am opening the ${en}.`,navigate:selector,topic:en};
  }
  return null;
}
function generateAssistantResponseBase(question){
  const q=normalizeAssistantText(question),hindi=assistantIsHindi(question);
  const nav=navigationAnswer(question,hindi);if(nav)return nav;
  const entities=findAssistantEntities(question);
  if(entities.length>=2 && /(difference|compare|versus| vs |अंतर|तुलना)/.test(` ${q} `)){
    const [a,b]=entities;
    return{text:hindi?`${a.short} का मुख्य क्षेत्र ${a.category} है और इसका मुख्यालय ${a.hq} में है। ${b.short} का मुख्य क्षेत्र ${b.category} है और इसका मुख्यालय ${b.hq} में है।`:`${a.short} focuses on ${a.category.toLowerCase()} and is headquartered in ${a.hq}. ${b.short} focuses on ${b.category.toLowerCase()} and is headquartered in ${b.hq}.`,topic:`${a.short} vs ${b.short}`};
  }
  if(entities.length)return agencyAnswer(entities[0],question,hindi);
  if(assistantContext.entityId && /^(where|when|who|what does it|what is its|its |tell me more|और|कहाँ|कब|कौन)/.test(q)){
    const previous=DATA.agencies.find(a=>a.id===assistantContext.entityId);
    if(previous)return agencyAnswer(previous,question,hindi);
  }
  if(/sdg|sustainable development goal|global goal|सतत विकास|लक्ष्य/.test(q))return sdgAnswer(question,hindi);
  if(/peacekeep|blue helmet|mission|शांति मिशन|ब्लू हेलमेट/.test(q))return missionAnswer(question,hindi);
  if(/hello|hi\b|hey|namaste|नमस्ते/.test(q))return{text:hindi?"नमस्ते! मैं UN AI Guide हूँ। आप किसी भी UN अंग, एजेंसी, SDG, शांति मिशन या वीटो शक्ति के बारे में पूछ सकते हैं।":"Hello! I am the UN AI Guide. Ask about any UN organ, agency, SDG, peacekeeping mission or veto power.",topic:"Welcome"};
  if(/how many.*member|193|सदस्य देश/.test(q))return{text:hindi?"संयुक्त राष्ट्र के 193 सदस्य देश हैं। प्रत्येक सदस्य देश महासभा में भाग लेता है।":"The United Nations has 193 Member States. Every Member State participates in the General Assembly.",navigate:"#ecosystem",topic:"Member States"};

  if(/general assembly.*(vote|voting)|unga.*(vote|voting)|महासभा.*मतदान/.test(q)){
    return{text:hindi
      ?"महासभा में प्रत्येक सदस्य देश का एक मत होता है। महत्वपूर्ण प्रश्नों के लिए उपस्थित और मतदान करने वाले सदस्यों का दो-तिहाई बहुमत चाहिए; अन्य प्रश्नों के लिए साधारण बहुमत चाहिए। मतदान सिमुलेटर खोल रहा हूँ।"
      :"In the General Assembly, every Member State has one vote. Important questions require a two-thirds majority of members present and voting; other questions require a simple majority. I am opening the voting simulator.",
      navigate:"#simulators",link:"https://www.un.org/en/ga/about/background.shtml",linkLabel:hindi?"आधिकारिक मतदान नियम":"Official voting rules",topic:"General Assembly voting"};
  }
  if(/veto/.test(q))return{text:hindi?"सुरक्षा परिषद के पाँच स्थायी सदस्यों में से किसी एक का 'No' मत महत्वपूर्ण प्रस्ताव को रोक सकता है। इसे वीटो कहा जाता है।":"A veto occurs when one of the five permanent Security Council members votes No on a substantive draft resolution, preventing its adoption.",navigate:"#simulators",topic:"Veto power"};
  if(/secretary.general|महासचिव/.test(q)){
    const un=DATA.agencies.find(a=>a.id==="un");return{text:hindi?`संयुक्त राष्ट्र का वर्तमान नेतृत्व: ${un.leader}.`:`Current UN leadership: ${un.leader}.`,link:un.url,linkLabel:hindi?"आधिकारिक UN वेबसाइट":"Official UN website",topic:"Secretary-General"};
  }
  if(/india.*un|un.*india|indian peacekeep|भारत.*संयुक्त राष्ट्र|भारतीय.*शांति/.test(q))return{text:hindi
    ?"भारत संयुक्त राष्ट्र का संस्थापक सदस्य है। 1948 से 2,75,000 से अधिक भारतीय कर्मियों ने UN शांति स्थापना में सेवा दी है, और 2026 की शुरुआत में 5,000 से अधिक भारतीय शांति सैनिक तैनात थे।"
    :"India is a founding Member State of the United Nations. More than 275,000 Indian personnel have served in UN peacekeeping since 1948, and over 5,000 were deployed in early 2026.",
    navigate:"#india-un",link:"https://india.un.org/en",linkLabel:hindi?"UN भारत वेबसाइट":"UN India website",topic:"India and the UN"};
  if(/official source|references|verify|स्रोत|सत्यापन/.test(q))return{text:hindi?"इस वेबसाइट के QR कोड और आधिकारिक लिंक UN तथा संबंधित एजेंसियों की वेबसाइटों पर ले जाते हैं।":"The QR codes and official links in this museum lead to UN and agency websites for verification.",link:"https://www.un.org/en/about-us",linkLabel:hindi?"UN आधिकारिक स्रोत":"UN official source",topic:"Official sources"};
  if(/what can you do|help|मदद/.test(q))return{text:hindi?"मैं UN अंगों और एजेंसियों की भूमिका, स्थापना वर्ष, मुख्यालय, नेतृत्व, SDGs, शांति मिशन और वीटो शक्ति समझा सकता हूँ। मैं वेबसाइट के सही भाग तक भी ले जा सकता हूँ।":"I can explain UN organs and agencies, founding years, headquarters, leadership, SDGs, peacekeeping missions and veto power. I can also open the correct museum section.",topic:"Help"};
  return{text:hindi?"मुझे इस प्रश्न का निश्चित उत्तर नहीं मिला। WHO, UNICEF, UNESCO, महासभा, सुरक्षा परिषद, ICJ, SDG, शांति स्थापना या वीटो शक्ति के बारे में पूछें।":"I could not find a confident answer to that question. Try asking about WHO, UNICEF, UNESCO, the General Assembly, Security Council, ICJ, an SDG, peacekeeping or veto power.",topic:"Try another question"};
}
function answerToHTML(answer){
  const text=escapeHTML(answer.text);
  const action=answer.link?`<a class="ai-answer-action" href="${answer.link}" target="_blank" rel="noopener">${escapeHTML(answer.linkLabel||"Official website")} ↗</a>`:"";
  return`<p>${text}</p>${action}`;
}
function botAnswer(question){return generateAssistantResponse(question).text;}
function addChat(question){
  const log=$("#chatLog"),answer=generateAssistantResponse(question);
  log.insertAdjacentHTML("beforeend",`<div class="user-message">${escapeHTML(question)}</div><div class="bot-message">${escapeHTML(answer.text)}</div>`);
  log.scrollTop=log.scrollHeight;
  if(answer.navigate)setTimeout(()=>document.querySelector(answer.navigate)?.scrollIntoView({behavior:"smooth",block:"start"}),250);
}
function escapeHTML(text){return String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function generateAssistantResponse(question){
  const lang=assistantLanguage(question);
  if(lang==="en"||lang==="hi")return generateAssistantResponseBase(question);
  const q=normalizeAssistantText(question),entities=findAssistantEntities(question);
  const isFrench=lang==="fr";
  const officialLabel=isFrench?"Ouvrir le site officiel":"Abrir sitio oficial";

  if(entities.length){
    const a=entities[0];
    if(/siège|où|localisé|sede|dónde|ubicad/.test(q))
      return{text:isFrench?`${a.name} a son siège à ${a.hq}.`:`${a.name} tiene su sede en ${a.hq}.`,link:a.url,linkLabel:officialLabel,topic:a.short};
    if(/fondé|créé|quand|fundad|cread|cuándo/.test(q))
      return{text:isFrench?`${a.name} a été créé en ${a.year}.`:`${a.name} fue creada en ${a.year}.`,link:a.url,linkLabel:officialLabel,topic:a.short};
    if(/rôle|fonction|fait|función|hace|trabajo/.test(q))
      return{text:isFrench?`${a.name} travaille principalement dans le domaine « ${a.category} ». Ses fonctions principales comprennent : ${a.functions.join("; ")}.`:`${a.name} trabaja principalmente en el área de ${a.category}. Sus funciones principales incluyen: ${a.functions.join("; ")}.`,link:a.url,linkLabel:officialLabel,topic:a.short};
    return{text:isFrench?`${a.name} (${a.short}) a été créé en ${a.year} et a son siège à ${a.hq}.`:`${a.name} (${a.short}) fue creada en ${a.year} y tiene su sede en ${a.hq}.`,link:a.url,linkLabel:officialLabel,topic:a.short};
  }
  if(/veto/.test(q))return{text:isFrench?"Le veto est le pouvoir des cinq membres permanents du Conseil de sécurité d’empêcher l’adoption d’un projet de résolution substantiel par un vote négatif.":"El veto es el poder de los cinco miembros permanentes del Consejo de Seguridad para impedir la aprobación de un proyecto de resolución sustantivo mediante un voto negativo.",navigate:"#simulators",topic:"Veto"};
  if(/sdg|odd|ods|objectif|objetivo|développement durable|desarrollo sostenible/.test(q))
    return{text:isFrench?"Les 17 objectifs de développement durable relient la pauvreté, la santé, l’éducation, l’égalité, le climat, la paix et les partenariats dans le Programme 2030.":"Los 17 Objetivos de Desarrollo Sostenible conectan la pobreza, la salud, la educación, la igualdad, el clima, la paz y las alianzas dentro de la Agenda 2030.",navigate:"#sdgs",topic:"SDGs"};
  if(/maintien de la paix|casques bleus|peacekeeping|mantenimiento de la paz|cascos azules/.test(q))
    return{text:isFrench?"Les opérations de maintien de la paix réunissent du personnel militaire, policier et civil pour protéger les civils, soutenir les cessez-le-feu et consolider la paix.":"Las operaciones de mantenimiento de la paz reúnen personal militar, policial y civil para proteger a la población, apoyar los altos el fuego y consolidar la paz.",navigate:"#peace",topic:"Peacekeeping"};
  if(/bonjour|salut|hola|buenas/.test(q))
    return{text:isFrench?"Bonjour ! Je suis le guide IA de l’ONU. Posez-moi une question sur un organe, une agence, les ODD, le maintien de la paix ou le veto.":"¡Hola! Soy la guía de IA de la ONU. Pregúntame sobre un órgano, una agencia, los ODS, el mantenimiento de la paz o el veto.",topic:"UN Guide"};
  if(/qu.est.ce que l.onu|nations unies|qué es la onu|que es la onu/.test(q))
    return{text:isFrench?"L’Organisation des Nations Unies est une organisation internationale fondée en 1945 où les États Membres coopèrent pour la paix, les droits humains, le développement et l’action humanitaire.":"Las Naciones Unidas son una organización internacional fundada en 1945 donde los Estados Miembros cooperan por la paz, los derechos humanos, el desarrollo y la acción humanitaria.",navigate:"#charter",topic:"United Nations"};
  return{text:isFrench?"Je peux vous aider à explorer les organes de l’ONU, les agences, les ODD, le maintien de la paix, le veto, les pays et les simulateurs de ce musée.":"Puedo ayudarte a explorar los órganos de la ONU, las agencias, los ODS, el mantenimiento de la paz, el veto, los países y los simuladores de este museo.",topic:"UN Guide"};
}

const agencyGames=[
 ["Protects children worldwide.",["UNICEF","WHO","IMF"],"UNICEF"],
 ["Coordinates global public health.",["FAO","WHO","UNESCO"],"WHO"],
 ["Protects cultural and natural heritage.",["UNESCO","WFP","UNHCR"],"UNESCO"],
 ["Provides emergency food assistance.",["WFP","ICJ","UNEP"],"WFP"]
];
let gameIndex=0;
function initAgencyGame(){gameIndex=Math.floor(Math.random()*agencyGames.length);renderAgencyGame();}
function renderAgencyGame(){
  const g=agencyGames[gameIndex];$("#agencyClue").textContent=g[0];$("#agencyGameResult").textContent="";
  $("#agencyChoices").innerHTML=g[1].map(x=>`<button type="button">${x}</button>`).join("");
  $("#agencyChoices").onclick=e=>{
    const btn=e.target.closest("button");if(!btn)return;
    if(btn.textContent===g[2]){$("#agencyGameResult").textContent="Correct! 🎉";setTimeout(()=>{gameIndex=(gameIndex+1)%agencyGames.length;renderAgencyGame();},850);}
    else $("#agencyGameResult").textContent="Try again.";
  };
}
function createCertificate(){
  const name=$("#studentName").value.trim()||"UN Explorer";
  const win=window.open("","_blank");
  if(!win){toast("Please allow pop-ups to create the certificate.");return;}
  win.document.write(`<!doctype html><html><head><title>UN Museum Certificate</title></head><body style="font-family:Arial;text-align:center;padding:55px;border:18px double #009edb;color:#07345a"><h1 style="font-size:45px">CERTIFICATE OF ACHIEVEMENT</h1><p>This certificate is proudly presented to</p><h2 style="font-size:38px">${escapeHTML(name)}</h2><p>for successfully exploring the</p><h2>UNITED NATIONS ECOSYSTEM DIGITAL MUSEUM</h2><p>and demonstrating knowledge of global cooperation, peace and sustainable development.</p><br><b>Tender Heart School • Exhibition 2026</b><script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}


let lastFloatingAIAnswer="";
function initFloatingAI(){
  const launcher=$("#aiLauncher"),panel=$("#aiPanel"),form=$("#aiForm"),input=$("#aiInput"),messages=$("#aiMessages");
  const openAI=()=>{
    panel.classList.add("open");panel.setAttribute("aria-hidden","false");$("#mobileAiBtn")?.classList.add("active");
    launcher.setAttribute("aria-expanded","true");launcher.classList.remove("has-unread");
    setTimeout(()=>input.focus(),180);
  };
  const closeAI=()=>{
    panel.classList.remove("open");panel.setAttribute("aria-hidden","true");
    launcher.setAttribute("aria-expanded","false");$("#mobileAiBtn")?.classList.remove("active");
  };
  launcher.addEventListener("click",()=>panel.classList.contains("open")?closeAI():openAI());
  $("#mobileAiBtn")?.addEventListener("click",()=>panel.classList.contains("open")?closeAI():openAI());
  $("#aiCloseBtn").addEventListener("click",closeAI);
  $("#aiClearBtn").addEventListener("click",()=>{
    messages.innerHTML=`<div class="ai-message ai-bot-message"><div class="ai-message-avatar">UN</div><div class="ai-bubble"><p>Hello! Ask about the UN, General Assembly, Security Council, WHO, UNICEF, peacekeeping, veto power or the SDGs.</p></div></div>`;
    assistantContext.entityId=null;lastFloatingAIAnswer="";$("#aiTopicLabel").textContent="Ready to help";
  });
  $("#aiSuggestions").addEventListener("click",e=>{
    const btn=e.target.closest("button");if(btn){input.value=btn.textContent;submitFloatingAI(btn.textContent);}
  });
  form.addEventListener("submit",e=>{
    e.preventDefault();const question=input.value.trim();if(question){input.value="";submitFloatingAI(question);}
  });
  $("#aiSpeakBtn").addEventListener("click",()=>{
    if(!lastFloatingAIAnswer){toast("Ask a question first.");return;}
    if(!("speechSynthesis" in window)){toast("Text-to-speech is not supported.");return;}
    speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(lastFloatingAIAnswer);
    speech.lang=languageLocale();speech.rate=.96;speechSynthesis.speak(speech);
  });
  initAIVoiceInput();
  function submitFloatingAI(question){
    appendAIUser(question);appendAITyping();
    const answer=generateAssistantResponse(question);
    const delay=TEST_MODE?0:Math.min(850,300+question.length*8);
    setTimeout(()=>{
      removeAITyping();appendAIBot(answer);lastFloatingAIAnswer=answer.text;
      assistantContext.lastAnswer=answer.text;assistantContext.lastLink=answer.link||"";
      $("#aiTopicLabel").textContent=answer.topic||"UN topic";
      if(answer.navigate){
        setTimeout(()=>document.querySelector(answer.navigate)?.scrollIntoView({behavior:TEST_MODE?"auto":"smooth",block:"start"}),500);
      }
    },delay);
  }
  function appendAIUser(text){
    messages.insertAdjacentHTML("beforeend",`<div class="ai-message ai-user-message"><div class="ai-bubble"><p>${escapeHTML(text)}</p></div></div>`);
    messages.scrollTop=messages.scrollHeight;
  }
  function appendAITyping(){
    messages.insertAdjacentHTML("beforeend",`<div id="aiTyping" class="ai-message ai-bot-message ai-typing"><div class="ai-message-avatar">UN</div><div class="ai-bubble"><i></i><i></i><i></i></div></div>`);
    messages.scrollTop=messages.scrollHeight;
  }
  function removeAITyping(){$("#aiTyping")?.remove();}
  function appendAIBot(answer){
    messages.insertAdjacentHTML("beforeend",`<div class="ai-message ai-bot-message"><div class="ai-message-avatar">UN</div><div class="ai-bubble">${answerToHTML(answer)}</div></div>`);
    messages.scrollTop=messages.scrollHeight;
    if(!panel.classList.contains("open"))launcher.classList.add("has-unread");
  }
  function initAIVoiceInput(){
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const mic=$("#aiMicBtn");
    if(!SpeechRecognition){mic.hidden=true;return;}
    const recognition=new SpeechRecognition();recognition.interimResults=false;recognition.continuous=false;
    recognition.lang=languageLocale();
    mic.addEventListener("click",()=>{
      recognition.lang=languageLocale();mic.classList.add("listening");
      try{recognition.start();}catch{}
    });
    recognition.onresult=e=>{const text=e.results[0][0].transcript;input.value=text;mic.classList.remove("listening");submitFloatingAI(text);};
    recognition.onerror=()=>{mic.classList.remove("listening");toast("Voice input could not hear you.");};
    recognition.onend=()=>mic.classList.remove("listening");
  }
}
const musicTracks=[
 {id:"one-world-overture",title:"One World Overture",subtitle:"Cinematic orchestral opening",icon:"🌍",src:"assets/music/one-world-overture.mp3",duration:"1:05"},
 {id:"peacekeepers-promise",title:"Peacekeepers’ Promise",subtitle:"Solemn peace and service theme",icon:"🕊️",src:"assets/music/peacekeepers-promise.mp3",duration:"1:11"},
 {id:"future-2030-horizon",title:"Future 2030 Horizon",subtitle:"Bright SDG technology theme",icon:"🎯",src:"assets/music/future-2030-horizon.mp3",duration:"0:55"},
 {id:"assembly-of-nations",title:"Assembly of Nations",subtitle:"Formal piano and strings",icon:"🏛️",src:"assets/music/assembly-of-nations.mp3",duration:"1:03"},
 {id:"humanitarian-dawn",title:"Humanitarian Dawn",subtitle:"Warm humanitarian action theme",icon:"⛑️",src:"assets/music/humanitarian-dawn.mp3",duration:"0:60"},
 {id:"planet-in-balance",title:"Planet in Balance",subtitle:"Nature, climate and reflection theme",icon:"🌿",src:"assets/music/planet-in-balance.mp3",duration:"1:01"}
];
let musicIndex=Math.max(0,Number(localStorage.getItem("unMusicTrack")||0)%musicTracks.length);
let musicUserVolume=Math.min(1,Math.max(0,Number(localStorage.getItem("unMusicVolume")||.46)));
let musicFadeFrame=0,musicSwitching=false,musicStarted=false,musicSleepTimer=0;
let musicShuffle=localStorage.getItem("unMusicShuffle")==="true";
let musicRepeat=localStorage.getItem("unMusicRepeat")||"all";
let musicMuted=localStorage.getItem("unMusicMuted")==="true";
let musicPreDuckVolume=null;

function initSound(){
  const audio=$("#museumAudio"),panel=$("#musicPanel"),backdrop=$("#musicBackdrop");
  if(!audio||!panel)return;
  audio.loop=musicRepeat==="one";
  audio.volume=musicMuted?0:musicUserVolume;
  $("#musicVolume").value=Math.round(musicUserVolume*100);
  $("#musicAutoTheme").checked=localStorage.getItem("unMusicAutoTheme")==="true";
  $("#musicSleep").value="0";

  const openPanel=()=>{
    panel.hidden=false;backdrop.hidden=false;document.body.classList.add("no-scroll");
    renderMusicPlayer();
  };
  const closePanel=()=>{panel.hidden=true;backdrop.hidden=true;document.body.classList.remove("no-scroll")};

  $("#soundBtn").addEventListener("click",openPanel);
  $("#miniMusicOpen").addEventListener("click",openPanel);
  $("#musicClose").addEventListener("click",closePanel);
  backdrop.addEventListener("click",closePanel);
  $("#musicPlay").addEventListener("click",toggleMusic);
  $("#miniMusicPlay").addEventListener("click",toggleMusic);
  $("#musicPrevious").addEventListener("click",()=>switchMusicTrack(previousMusicIndex(),true));
  $("#musicNext").addEventListener("click",()=>switchMusicTrack(nextMusicIndex(),true));
  $("#miniMusicNext").addEventListener("click",()=>switchMusicTrack(nextMusicIndex(),true));
  $("#musicShuffle").addEventListener("click",()=>{
    musicShuffle=!musicShuffle;localStorage.setItem("unMusicShuffle",String(musicShuffle));renderMusicPlayer();
    toast(musicShuffle?"Shuffle enabled":"Shuffle disabled");
  });
  $("#musicRepeat").addEventListener("click",()=>{
    musicRepeat=musicRepeat==="all"?"one":"all";localStorage.setItem("unMusicRepeat",musicRepeat);
    audio.loop=musicRepeat==="one";renderMusicPlayer();
    toast(musicRepeat==="one"?"Repeating current track":"Repeating all tracks");
  });
  $("#musicMute").addEventListener("click",toggleMusicMute);
  $("#musicTrackList").addEventListener("click",e=>{
    const b=e.target.closest("[data-music-track]");
    if(b)switchMusicTrack(Number(b.dataset.musicTrack),true);
  });
  $("#musicVolume").addEventListener("input",e=>{
    musicUserVolume=Number(e.target.value)/100;
    musicMuted=false;
    localStorage.setItem("unMusicVolume",String(musicUserVolume));
    localStorage.setItem("unMusicMuted","false");
    if(!audio.paused)audio.volume=musicUserVolume;
    renderMusicPlayer();
  });
  $("#musicSleep").addEventListener("change",e=>setMusicSleepTimer(Number(e.target.value)));
  $("#musicProgress").addEventListener("input",e=>{
    if(audio.duration)audio.currentTime=audio.duration*(Number(e.target.value)/1000)
  });
  $("#musicAutoTheme").addEventListener("change",e=>{
    localStorage.setItem("unMusicAutoTheme",String(e.target.checked))
  });
  audio.addEventListener("loadedmetadata",updateMusicTime);
  audio.addEventListener("timeupdate",updateMusicTime);
  audio.addEventListener("play",()=>{
    musicStarted=true;document.body.classList.add("music-has-started");
    $("#musicMiniPlayer").hidden=false;setMusicPlayingUI(true)
  });
  audio.addEventListener("pause",()=>setMusicPlayingUI(false));
  audio.addEventListener("ended",()=>{
    if(musicRepeat==="one"){audio.currentTime=0;audio.play().catch(()=>{})}
    else switchMusicTrack(nextMusicIndex(),true);
  });
  audio.addEventListener("error",()=>toast("The soundtrack could not load. Upload the complete assets/music folder."));

  document.addEventListener("keydown",e=>{
    if(/input|textarea|select/i.test(document.activeElement?.tagName))return;
    if(e.key==="Escape"&&!panel.hidden)closePanel();
    if(e.key.toLowerCase()==="m"){e.preventDefault();toggleMusicMute()}
  });

  let autoThemeTimer=0;
  addEventListener("scroll",()=>{
    if(!$("#musicAutoTheme").checked||audio.paused)return;
    clearTimeout(autoThemeTimer);autoThemeTimer=setTimeout(updateSectionMusic,260);
  },{passive:true});

  loadMusicTrack(musicIndex,false);
  renderMusicPlayer();

  async function toggleMusic(){
    if(audio.paused){
      try{
        if(!audio.src)loadMusicTrack(musicIndex,false);
        audio.volume=0;
        await audio.play();
        await fadeMusic(musicMuted?0:musicUserVolume,850);
        state.sound=true;toast(`Playing “${musicTracks[musicIndex].title}”`);
      }catch(error){
        reportError(error);toast("Tap Play again or check the browser audio permission.");
      }
    }else{
      await fadeMusic(0,480);audio.pause();audio.volume=musicMuted?0:musicUserVolume;state.sound=false;
    }
  }
  function updateMusicTime(){
    $("#musicCurrentTime").textContent=formatMusicTime(audio.currentTime||0);
    $("#musicDuration").textContent=formatMusicTime(audio.duration||0);
    $("#musicProgress").value=audio.duration?Math.round(audio.currentTime/audio.duration*1000):0;
  }
}

function formatMusicTime(seconds){
  if(!Number.isFinite(seconds))return"0:00";
  const m=Math.floor(seconds/60),s=Math.floor(seconds%60);
  return`${m}:${String(s).padStart(2,"0")}`;
}
function nextMusicIndex(){
  if(musicShuffle&&musicTracks.length>1){
    let next=musicIndex;
    while(next===musicIndex)next=Math.floor(Math.random()*musicTracks.length);
    return next;
  }
  return(musicIndex+1)%musicTracks.length;
}
function previousMusicIndex(){return(musicIndex-1+musicTracks.length)%musicTracks.length}
function renderMusicPlayer(){
  const t=musicTracks[musicIndex];if(!t)return;
  $("#musicTrackTitle").textContent=t.title;
  $("#musicTrackSubtitle").textContent=t.subtitle;
  $("#miniMusicIcon").textContent=t.icon;
  $("#miniMusicTitle").textContent=t.title;
  $("#miniMusicSubtitle").textContent=t.subtitle;
  $("#musicTrackList").innerHTML=musicTracks.map((track,i)=>`
    <button class="music-track ${i===musicIndex?"active":""}" type="button" data-music-track="${i}">
      <span>${track.icon}</span>
      <span><b>${track.title}</b><small>${track.subtitle}</small></span>
      <i>${track.duration}</i>
    </button>`).join("");
  $("#musicShuffle").classList.toggle("active",musicShuffle);
  $("#musicRepeat").classList.toggle("active",musicRepeat==="one");
  $("#musicRepeat").textContent=musicRepeat==="one"?"↻¹":"↻";
  $("#musicRepeat").title=musicRepeat==="one"?"Repeat one":"Repeat all";
  $("#musicMute").innerHTML=`<span>${musicMuted?"🔇":"🔊"}</span><b>${musicMuted?"Unmute":"Mute"}</b>`;
  document.body.classList.toggle("music-muted",musicMuted);
  setMusicPlayingUI(!$("#museumAudio").paused);
}
function setMusicPlayingUI(playing){
  document.body.classList.toggle("music-playing",playing);
  $("#musicPlay").textContent=playing?"❚❚":"▶";
  $("#miniMusicPlay").textContent=playing?"❚❚":"▶";
  $("#musicPlay").setAttribute("aria-label",playing?"Pause music":"Play music");
  $("#miniMusicPlay").setAttribute("aria-label",playing?"Pause music":"Play music");
  $("#soundBtn").classList.toggle("music-active",playing);
  $("#soundBtn").setAttribute("aria-pressed",String(playing));
}
function loadMusicTrack(index,keepTime=false){
  const audio=$("#museumAudio");
  musicIndex=(index+musicTracks.length)%musicTracks.length;
  localStorage.setItem("unMusicTrack",String(musicIndex));
  const priorTime=keepTime?audio.currentTime:0;
  audio.src=musicTracks[musicIndex].src;audio.load();
  if(keepTime)audio.currentTime=priorTime;
  renderMusicPlayer();
}
async function switchMusicTrack(index,autoplay=false){
  if(musicSwitching||(index===musicIndex&&$("#museumAudio").src))return;
  musicSwitching=true;
  const audio=$("#museumAudio"),wasPlaying=!audio.paused||autoplay;
  if(!audio.paused)await fadeMusic(0,520);
  audio.pause();loadMusicTrack(index,false);audio.volume=0;
  if(wasPlaying){
    try{await audio.play();await fadeMusic(musicMuted?0:musicUserVolume,850)}catch{}
  }else audio.volume=musicMuted?0:musicUserVolume;
  musicSwitching=false;
}
function fadeMusic(target,duration=600){
  const audio=$("#museumAudio");cancelAnimationFrame(musicFadeFrame);
  const start=audio.volume,begin=performance.now();
  return new Promise(resolve=>{
    const step=now=>{
      const p=Math.min(1,(now-begin)/duration);
      const ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      audio.volume=Math.max(0,Math.min(1,start+(target-start)*ease));
      if(p<1)musicFadeFrame=requestAnimationFrame(step);else resolve();
    };
    musicFadeFrame=requestAnimationFrame(step);
  });
}
function toggleMusicMute(){
  const audio=$("#museumAudio");
  musicMuted=!musicMuted;
  localStorage.setItem("unMusicMuted",String(musicMuted));
  fadeMusic(musicMuted?0:musicUserVolume,280);
  renderMusicPlayer();
  toast(musicMuted?"Music muted":"Music unmuted");
}
function setMusicSleepTimer(minutes){
  clearTimeout(musicSleepTimer);musicSleepTimer=0;
  if(!minutes){toast("Sleep timer turned off");return}
  musicSleepTimer=setTimeout(async()=>{
    await fadeMusic(0,1200);$("#museumAudio").pause();$("#museumAudio").volume=musicMuted?0:musicUserVolume;
    $("#musicSleep").value="0";toast("Music stopped by sleep timer");
  },minutes*60*1000);
  toast(`Music will stop in ${minutes} minutes`);
}
async function duckMusicForNarration(active){
  const audio=$("#museumAudio");if(audio.paused)return;
  if(active){
    musicPreDuckVolume=audio.volume;
    await fadeMusic(Math.min(audio.volume,.12),350);
  }else{
    await fadeMusic(musicMuted?0:musicUserVolume,600);
    musicPreDuckVolume=null;
  }
}
function updateSectionMusic(){
  const sections=$$("main section[id]");let active=sections[0];
  sections.forEach(section=>{if(section.getBoundingClientRect().top<innerHeight*.45)active=section});
  const id=active?.id||"home";let target=0;
  if(["peace","situation-room"].includes(id))target=1;
  else if(["sdgs","sdg-city","careers","international-days"].includes(id))target=2;
  else if(["simulators","diplomacy-lab","resolution-builder","chamber-tour"].includes(id))target=3;
  else if(["work","funding","countries"].includes(id))target=4;
  else if(["gallery","india-un","history","knowledge","learning"].includes(id))target=5;
  if(target!==musicIndex)switchMusicTrack(target,true);
}

function openModal(html){
  $("#modalBody").innerHTML=html;$("#modal").hidden=false;document.body.classList.add("no-scroll");$("#modalClose").focus();
}
function closeModal(){$("#modal").hidden=true;document.body.classList.remove("no-scroll");}
function initModal(){
  $("#modalClose").addEventListener("click",closeModal);
  $("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#modal").hidden)closeModal();closeTour();closeDrawerFallback();}});
  document.body.addEventListener("click",e=>{const btn=e.target.closest("[data-agency]");if(btn)openAgency(btn.dataset.agency);});
}
function closeDrawerFallback(){
  $("#roomsDrawer").classList.remove("open");$("#roomsDrawer").setAttribute("aria-hidden","true");$("#drawerBackdrop").hidden=true;document.body.classList.remove("no-scroll");
}

const tourSteps=[
 ["home","Welcome","This museum explains how the United Nations ecosystem works."],
 ["ecosystem","Complete Ecosystem","Explore how principal organs, agencies, programmes, peace, rights and development connect."],
 ["agencies","Agency Explorer","Search any organization and open its QR-linked official profile."],
 ["map","World Map","Select major international centres and headquarters."],
 ["peace","Peacekeeping Centre","Review current missions and the peace process."],
 ["sdgs","SDG Gallery","Open any of the 17 Goals."],
 ["simulators","Decision Chamber","Try Security Council voting and crisis coordination."],
 ["gallery","Virtual Gallery","Visit stylized rooms for key UN places and activities."],
 ["learning","Learning Lab","Finish with the quiz, assistant, game and certificate."]
];
function initTour(){
  $("#tourBtn").addEventListener("click",()=>{state.tourIndex=0;$("#tourCard").hidden=false;showTourStep();});
  $("#tourClose").addEventListener("click",closeTour);
  $("#tourPrev").addEventListener("click",()=>{if(state.tourIndex>0){state.tourIndex--;showTourStep();}});
  $("#tourNext").addEventListener("click",()=>{if(state.tourIndex<tourSteps.length-1){state.tourIndex++;showTourStep();}else closeTour();});
}
function showTourStep(){
  const [id,title,text]=tourSteps[state.tourIndex];
  $("#tourCount").textContent=`STOP ${state.tourIndex+1} OF ${tourSteps.length}`;
  $("#tourTitle").textContent=title;$("#tourText").textContent=text;
  $("#tourPrev").disabled=state.tourIndex===0;$("#tourNext").textContent=state.tourIndex===tourSteps.length-1?"Finish":"Next";
  document.getElementById(id)?.scrollIntoView({behavior:TEST_MODE?"auto":"smooth",block:"start"});
}
function closeTour(){$("#tourCard").hidden=true;}

const presentationSections=$$(".presentation-stop");
function initPresentation(){
  $("#presentBtn").addEventListener("click",()=>startPresentation());
  $("#presentExit").addEventListener("click",stopPresentation);
  $("#presentPrev").addEventListener("click",()=>movePresentation(-1));
  $("#presentNext").addEventListener("click",()=>movePresentation(1));
  document.addEventListener("keydown",e=>{
    if(!state.presentation)return;
    if(e.key==="ArrowRight"||e.key==="PageDown")movePresentation(1);
    if(e.key==="ArrowLeft"||e.key==="PageUp")movePresentation(-1);
  });
}
async function startPresentation(){
  state.presentation=true;state.presentationIndex=Math.max(0,presentationSections.findIndex(s=>s.getBoundingClientRect().top>=-100));
  document.body.classList.add("presentation-mode");$("#presentationControls").hidden=false;showPresentationSection();
  try{await document.documentElement.requestFullscreen?.();}catch{}
}
function stopPresentation(){
  state.presentation=false;document.body.classList.remove("presentation-mode");$("#presentationControls").hidden=true;
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
}
function movePresentation(delta){state.presentationIndex=Math.max(0,Math.min(presentationSections.length-1,state.presentationIndex+delta));showPresentationSection();}
function showPresentationSection(){
  presentationSections[state.presentationIndex]?.scrollIntoView({behavior:TEST_MODE?"auto":"smooth",block:"start"});
  $("#presentLabel").textContent=`${state.presentationIndex+1} / ${presentationSections.length}`;
}



function initMobileNavigation(){
  const nav=$("#mobileNav"),aiButton=$("#mobileAiBtn"),exploreButton=$("#mobileExploreBtn");
  if(!nav)return;

  aiButton?.addEventListener("click",()=>{
    $("#aiLauncher")?.click();
    aiButton.classList.toggle("active",$("#aiPanel")?.classList.contains("open"));
  });

  exploreButton?.addEventListener("click",()=>{
    $("#roomsDrawer")?.classList.add("open");
    $("#roomsDrawer")?.setAttribute("aria-hidden","false");
    if($("#drawerBackdrop"))$("#drawerBackdrop").hidden=false;
    document.body.classList.add("no-scroll");
  });

  $$("[data-proxy-click]").forEach(button=>button.addEventListener("click",()=>{
    const target=document.getElementById(button.dataset.proxyClick);
    $("#mainNav")?.classList.remove("open");
    target?.click();
  }));

  $$("#mobileNav a").forEach(link=>link.addEventListener("click",()=>{
    $("#mainNav")?.classList.remove("open");
  }));

  const links={
    home:$("#mobileNav [data-mobile-section='home']"),
    map:$("#mobileNav [data-mobile-section='map']"),
    simulators:$("#mobileNav [data-mobile-section='simulators']")
  };
  const exploreSections=["ecosystem","agencies","peace","sdgs","sdg-city","gallery","india-un","history","learning"]
    .map(id=>document.getElementById(id)).filter(Boolean);

  const update=()=>{
    const mapSection=$("#map"),simSection=$("#simulators");
    let active="home";
    if(simSection&&simSection.getBoundingClientRect().top<innerHeight*.45)active="simulators";
    else if(mapSection&&mapSection.getBoundingClientRect().top<innerHeight*.45)active="map";
    else if(exploreSections.some(section=>{
      const rect=section.getBoundingClientRect();
      return rect.top<innerHeight*.48&&rect.bottom>innerHeight*.28;
    }))active="explore";

    Object.entries(links).forEach(([key,link])=>link?.classList.toggle("active",key===active));
    exploreButton?.classList.toggle("active",active==="explore");
    aiButton?.classList.toggle("active",$("#aiPanel")?.classList.contains("open"));
  };

  addEventListener("scroll",update,{passive:true});
  addEventListener("resize",()=>{
    if(innerWidth>900){
      $("#mainNav")?.classList.remove("open");
      $("#roomsDrawer")?.classList.remove("open");
      if($("#drawerBackdrop"))$("#drawerBackdrop").hidden=true;
      document.body.classList.remove("no-scroll");
    }
  });
  update();
}


function initSDGCity(){
  $$("#sdgCityScene [data-city-goal]").forEach(btn=>btn.addEventListener("click",()=>{
    $$("#sdgCityScene [data-city-goal]").forEach(x=>x.classList.toggle("active",x===btn));
    const index=Number(btn.dataset.cityGoal),goal=DATA.sdgs[index];
    $("#sdgCityPanel").innerHTML=`<div class="sdg-number">${index+1}</div><p class="eyebrow">SDG CITY BUILDING</p><h3>${goal[0]}</h3><p>${goal[2]}</p><p><b>City example:</b> ${goal[3]}</p><button class="button primary small" type="button" id="openGoalFromCity">Open Goal ${index+1}</button>`;
    $("#openGoalFromCity").onclick=()=>{showSDG(index);$("#sdgs").scrollIntoView({behavior:"smooth"});};
  }));
}
function initIndiaUN(){
  $("#indiaPeaceBtn")?.addEventListener("click",()=>$("#peace").scrollIntoView({behavior:"smooth"}));
  $("#indiaQuizBtn")?.addEventListener("click",()=>{
    $("#aiLauncher")?.click();
    setTimeout(()=>{const input=$("#aiInput");if(input){input.value="Explain India and the United Nations";input.focus();}},300);
  });
}
let deferredInstallPrompt=null;
function initPWA(){
  if("serviceWorker" in navigator && location.protocol!=="file:"){
    navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"}).then(reg=>reg.update()).catch(()=>{});
  }
  addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();deferredInstallPrompt=event;$("#installBtn").hidden=false;
  });
  const install=async()=>{
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("#installBtn").hidden=true;
    }else toast("Use your browser menu and choose “Install app” or “Add to Home screen”.");
  };
  $("#installBtn")?.addEventListener("click",install);
  $("#dashboardInstall")?.addEventListener("click",install);
}
function initUtilityPanels(){
  const backdrop=$("#utilityBackdrop");
  const openPanel=id=>{
    $("#accessPanel").hidden=id!=="accessPanel";$("#controlPanel").hidden=id!=="controlPanel";backdrop.hidden=false;
  };
  const closePanels=()=>{$("#accessPanel").hidden=true;$("#controlPanel").hidden=true;backdrop.hidden=true;};
  $("#accessBtn")?.addEventListener("click",()=>openPanel("accessPanel"));
  $("#controlBtn")?.addEventListener("click",()=>openPanel("controlPanel"));
  $$("[data-close-panel]").forEach(btn=>btn.addEventListener("click",closePanels));backdrop?.addEventListener("click",closePanels);
  let scale=Number(localStorage.getItem("unFontScale")||1);
  const applyScale=()=>{document.documentElement.style.setProperty("--font-scale",scale);localStorage.setItem("unFontScale",scale)};
  $("#textSmaller").onclick=()=>{scale=Math.max(.86,scale-.08);applyScale()};$("#textLarger").onclick=()=>{scale=Math.min(1.28,scale+.08);applyScale()};$("#textReset").onclick=()=>{scale=1;applyScale()};applyScale();
  const toggles=[["contrastToggle","high-contrast"],["motionToggle","reduce-motion"],["focusToggle","extra-focus"]];
  toggles.forEach(([id,cls])=>{
    const input=$("#"+id),saved=localStorage.getItem(cls)==="true";input.checked=saved;document.body.classList.toggle(cls,saved);
    input.addEventListener("change",()=>{document.body.classList.toggle(cls,input.checked);localStorage.setItem(cls,input.checked)});
  });
  $("#dashboardPresent").onclick=()=>{closePanels();startPresentation()};
  $("#dashboardReset").onclick=()=>{if(confirm("Reset voting, quiz and simulations?"))location.reload()};
  $("#dashboardQR").onclick=()=>openModal(`<p class="eyebrow">OFFICIAL UNITED NATIONS</p><h2 id="modalTitle">Scan the UN QR Code</h2><img class="modal-qr" src="assets/qr/un.png" alt="United Nations official website QR code"><p>This opens the official United Nations website.</p>`);
}
let autoTourTimer=null,kioskTimer=null,lastActivity=Date.now();
function initKioskAndAutoTour(){
  const stops=["home","ecosystem","agencies","map","peace","sdgs","sdg-city","simulators","gallery","india-un","history","learning"];
  $("#autoTourBtn")?.addEventListener("click",()=>{
    $("#controlPanel").hidden=true;$("#utilityBackdrop").hidden=true;
    clearInterval(autoTourTimer);let index=0;document.getElementById(stops[0]).scrollIntoView();
    autoTourTimer=setInterval(()=>{index=(index+1)%stops.length;document.getElementById(stops[index])?.scrollIntoView({behavior:"smooth"});},9000);
    toast("Automatic museum tour started. Tap anywhere to stop.");
  });
  const stopAuto=()=>{if(autoTourTimer){clearInterval(autoTourTimer);autoTourTimer=null;toast("Automatic tour stopped.");}};
  ["pointerdown","keydown"].forEach(type=>addEventListener(type,stopAuto,{once:false}));
  const startKiosk=()=>{
    document.body.classList.add("kiosk-mode");$("#kioskBadge").hidden=false;$("#controlPanel").hidden=true;$("#utilityBackdrop").hidden=true;
    lastActivity=Date.now();$("#kioskStatus").textContent="Kiosk mode is active.";toast("Kiosk mode started.");
    clearInterval(kioskTimer);kioskTimer=setInterval(()=>{
      const minutes=Number($("#idleMinutes").value||2);
      if(Date.now()-lastActivity>minutes*60000){$("#home").scrollIntoView({behavior:"smooth"});closeModal();closeTour();lastActivity=Date.now();}
    },5000);
  };
  const stopKiosk=()=>{document.body.classList.remove("kiosk-mode");$("#kioskBadge").hidden=true;clearInterval(kioskTimer);$("#kioskStatus").textContent="Kiosk mode is off.";toast("Kiosk mode ended.");};
  $("#kioskBtn")?.addEventListener("click",startKiosk);$("#exitKioskBtn")?.addEventListener("click",stopKiosk);
  ["pointerdown","keydown","scroll"].forEach(type=>addEventListener(type,()=>lastActivity=Date.now(),{passive:true}));
}


function initPerformanceMode(){
  const lowMemory=typeof navigator.deviceMemory==="number"&&navigator.deviceMemory<=4;
  const lowCPU=typeof navigator.hardwareConcurrency==="number"&&navigator.hardwareConcurrency<=4;
  const narrow=matchMedia("(max-width:480px)").matches;
  if(lowMemory||lowCPU||narrow)document.body.classList.add("lite-mode");
}
function initBackToTop(){
  const button=$("#backToTop");if(!button)return;
  const update=()=>button.classList.toggle("show",scrollY>700);
  addEventListener("scroll",update,{passive:true});
  button.addEventListener("click",()=>scrollTo({top:0,behavior:TEST_MODE?"auto":"smooth"}));
  update();
}
function initHeroRoomStrip(){
  $$(".hero-room-strip a").forEach(link=>link.addEventListener("click",()=>{
    const target=$(link.getAttribute("href"));
    if(target)setTimeout(()=>target.classList.add("room-highlight"),350);
    setTimeout(()=>target?.classList.remove("room-highlight"),1600);
  }));
}


const professionalValues={
  peace:["Peaceful settlement","Member States are expected to resolve international disputes through negotiation, mediation, arbitration, judicial settlement and other peaceful means."],
  dignity:["Human dignity","The UN system promotes the equal rights, safety and fundamental freedoms of every person."],
  equality:["Sovereign equality","The Charter recognizes the legal equality of Member States, regardless of territory, population or power."],
  cooperation:["International cooperation","Countries work together on economic, social, cultural, humanitarian and environmental challenges that cross borders."],
  law:["International law","Treaties, courts and agreed rules support predictable and peaceful relations between states."],
  future:["Future generations","The UN was created to protect coming generations from war and to promote social progress and better standards of life."]
};
function initCharterValues(){
  $("#valueGrid")?.addEventListener("click",e=>{
    const button=e.target.closest("[data-value]");if(!button)return;
    $$("#valueGrid [data-value]").forEach(x=>x.classList.toggle("active",x===button));
    const [title,text]=professionalValues[button.dataset.value];
    $("#valueDetail").innerHTML=`<p class="eyebrow">CORE VALUE</p><h3>${title}</h3><p>${text}</p>`;
  });
}

const workPillars={
  peace:{icon:"🕊️",label:"PEACE & SECURITY",title:"Prevent, mediate, protect and rebuild",text:"Diplomacy and early warning aim to prevent violence. When conflict occurs, the UN may support mediation, peacekeeping, humanitarian access and peacebuilding.",tags:["Security Council","DPPA","Peacekeeping","Peacebuilding"],href:"#peace",action:"Explore Peacekeeping"},
  rights:{icon:"⚖️",label:"HUMAN RIGHTS",title:"Turn universal principles into protection",text:"Human rights bodies review situations, support national institutions, document violations and help people understand and claim their rights.",tags:["Human Rights Council","OHCHR","UN Women","UNICEF"],href:"#agencies",action:"Explore Organizations"},
  humanitarian:{icon:"⛑️",label:"HUMANITARIAN ACTION",title:"Coordinate life-saving assistance",text:"During emergencies, the UN supports needs assessments, protection, food, health care, shelter, clean water, education and logistics.",tags:["OCHA","UNHCR","WFP","WHO","UNICEF"],href:"#simulators",action:"Open Crisis Simulator"},
  development:{icon:"🌱",label:"SUSTAINABLE DEVELOPMENT",title:"Help countries build inclusive progress",text:"The UN development system supports institutions, livelihoods, education, health, climate resilience, cities and the Sustainable Development Goals.",tags:["UNDP","UNEP","FAO","UN-Habitat","ECOSOC"],href:"#sdgs",action:"Explore the SDGs"},
  law:{icon:"📜",label:"INTERNATIONAL LAW",title:"Build rules for peaceful cooperation",text:"The UN helps states negotiate treaties, codify international law, settle disputes and create standards for shared global spaces.",tags:["ICJ","Sixth Committee","Treaty Bodies","Law Commission"],href:"#ecosystem",action:"Explore the UN System"}
};
const issueData=[
  {id:"climate",label:"Climate",icon:"🌍",title:"Climate change",text:"Climate action requires science, finance, adaptation, disaster preparedness, energy transition and international agreements.",agencies:["UNEP","UNDP","WMO","UNFCCC","UN-Habitat"],link:"#sdg-city"},
  {id:"health",label:"Health",icon:"🏥",title:"Global health emergencies",text:"Public-health threats require surveillance, standards, laboratories, public information, logistics, vaccination and resilient health systems.",agencies:["WHO","UNICEF","WFP","UNDP","Member States"],link:"#agencies"},
  {id:"refugees",label:"Refugees",icon:"🏕️",title:"Forced displacement",text:"People fleeing conflict or persecution may need protection, registration, shelter, food, health care, education and durable solutions.",agencies:["UNHCR","WFP","UNICEF","WHO","OCHA"],link:"#simulators"},
  {id:"food",label:"Food",icon:"🌾",title:"Food security",text:"Ending hunger involves emergency assistance, resilient agriculture, nutrition, markets, climate information and rural development.",agencies:["FAO","WFP","IFAD","UNICEF","UNDP"],link:"#agencies"},
  {id:"education",label:"Education",icon:"📚",title:"Education for all",text:"Education systems need trained teachers, safe schools, technology, inclusion, cultural understanding and support during crises.",agencies:["UNESCO","UNICEF","UNHCR","UNRWA","Member States"],link:"#sdgs"},
  {id:"equality",label:"Equality",icon:"🤝",title:"Equality and inclusion",text:"Reducing inequality requires rights, participation, public services, social protection and institutions that serve every community.",agencies:["UN Women","OHCHR","UNDP","ILO","UNICEF"],link:"#india-un"}
];
function initUNWork(){
  $("#pillarRail")?.addEventListener("click",e=>{
    const button=e.target.closest("[data-pillar]");if(!button)return;
    $$("#pillarRail [data-pillar]").forEach(x=>x.classList.toggle("active",x===button));
    const p=workPillars[button.dataset.pillar];
    $("#pillarDetail").innerHTML=`<div class="pillar-visual"><span>${p.icon}</span><i></i></div><p class="eyebrow">${p.label}</p><h3>${p.title}</h3><p>${p.text}</p><div class="agency-tags">${p.tags.map(x=>`<span>${x}</span>`).join("")}</div><a class="button primary small" href="${p.href}">${p.action}</a>`;
  });
  if($("#issueTabs")){
    $("#issueTabs").innerHTML=issueData.map((issue,i)=>`<button type="button" class="${i===0?"active":""}" data-issue="${i}">${issue.label}</button>`).join("");
    $("#issueTabs").addEventListener("click",e=>{const b=e.target.closest("[data-issue]");if(!b)return;showIssue(Number(b.dataset.issue));});
    showIssue(0);
  }
}
function showIssue(index){
  const issue=issueData[index];if(!issue)return;
  $$("#issueTabs [data-issue]").forEach(x=>x.classList.toggle("active",Number(x.dataset.issue)===index));
  $("#issueDetail").innerHTML=`<div class="issue-symbol">${issue.icon}</div><div><p class="eyebrow">COORDINATED RESPONSE</p><h4>${issue.title}</h4><p>${issue.text}</p><div class="issue-response">${issue.agencies.map(x=>`<span>${x}</span>`).join("")}</div><p><a class="text-link" href="${issue.link}">Explore this topic →</a></p></div>`;
}

const glossaryData=[
 ["Abstention","A decision not to vote Yes or No. In General Assembly majority calculations, abstentions are not counted as members present and voting."],
 ["Agenda","The formal list of subjects scheduled for discussion by a UN body."],
 ["Charter","The founding treaty that establishes the purposes, principles and principal organs of the United Nations."],
 ["Consensus","Adoption without a formal recorded vote because no delegation raises an objection."],
 ["Convention","A formal international agreement between states, often open for signature and ratification."],
 ["Delegate","A person officially representing a Member State or organization at a meeting."],
 ["Diplomacy","Communication and negotiation used to manage international relations and settle disagreements."],
 ["ECOSOC","The Economic and Social Council, which coordinates economic, social and development work."],
 ["General Assembly","The main deliberative and representative organ in which all 193 Member States participate."],
 ["Humanitarian access","The ability of relief personnel and supplies to reach people affected by crisis."],
 ["ICJ","The International Court of Justice, the principal judicial organ of the United Nations."],
 ["Mandate","The official authority, responsibilities and limits given to a UN body, mission or operation."],
 ["Member State","A sovereign state admitted to membership in the United Nations."],
 ["Multilateralism","Cooperation among multiple countries through shared rules and institutions."],
 ["Peacebuilding","Long-term work that reduces the risk of conflict returning and supports institutions and reconciliation."],
 ["Peacekeeping","Field operations using military, police and civilian personnel to support peace and security."],
 ["Preamble","The opening part of a treaty that states its purposes and guiding ideas."],
 ["Ratification","A state’s formal confirmation that it agrees to be legally bound by a treaty."],
 ["Resolution","A formal decision or expression of the will of a UN organ."],
 ["Sanctions","Restrictions used to influence behaviour without using armed force."],
 ["Secretariat","The principal organ that performs the day-to-day work of the United Nations."],
 ["Secretary-General","The chief administrative officer of the United Nations and an international diplomat."],
 ["Security Council","The 15-member principal organ with primary responsibility for international peace and security."],
 ["Sovereign equality","The principle that states are legally equal under the UN Charter."],
 ["Specialized agency","An autonomous international organization linked to the UN through an agreement."],
 ["Sustainable development","Development that integrates economic progress, social inclusion and environmental protection."],
 ["Treaty","A written international agreement governed by international law."],
 ["UN Charter","The treaty signed in 1945 that created the United Nations."],
 ["Veto","A No vote by a permanent Security Council member that prevents adoption of a substantive draft resolution."],
 ["Working language","A language used for the internal work and documentation of an institution."]
];
const decisionSteps=[
 ["Issue raised","A Member State, UN body or international situation places an issue on the agenda."],
 ["Draft prepared","A delegation or group writes proposed text describing concerns and recommended action."],
 ["Negotiation","Delegations discuss wording, propose amendments and seek wider support."],
 ["Vote","Members vote according to the rules of the organ considering the draft."],
 ["Implementation","UN entities, Member States and partners carry out the agreed action within the mandate."],
 ["Review","Reports, data and meetings assess progress, difficulties and future decisions."]
];
function initKnowledgeCentre(){
  renderGlossary("");
  $("#glossarySearch")?.addEventListener("input",e=>renderGlossary(e.target.value));
  $("#decisionStepper")?.addEventListener("click",e=>{
    const b=e.target.closest("[data-step]");if(!b)return;
    $$("#decisionStepper [data-step]").forEach(x=>x.classList.toggle("active",x===b));
    const index=Number(b.dataset.step),step=decisionSteps[index];
    $("#decisionDetail").innerHTML=`<span>${String(index+1).padStart(2,"0")}</span><div><h4>${step[0]}</h4><p>${step[1]}</p></div>`;
  });
}
function renderGlossary(query){
  const q=String(query||"").trim().toLowerCase();
  const items=glossaryData.filter(([term,definition])=>!q||`${term} ${definition}`.toLowerCase().includes(q));
  $("#glossaryList").innerHTML=items.length?items.map(([term,definition])=>{
    const marked=q?term.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"ig"),"<mark>$1</mark>"):term;
    return `<article class="glossary-item"><b>${marked}</b><p>${definition}</p></article>`;
  }).join(""):`<div class="search-empty"><span>⌕</span><p>No glossary term found.</p></div>`;
}

const museumSearchIndex=[
  {title:"UN Charter and Values",description:"Founding document, principles and official languages.",icon:"📜",target:"#charter",keywords:"charter values peace equality languages articles chapters"},
  {title:"United Nations Ecosystem",description:"Principal organs, agencies, programmes and global action.",icon:"🌐",target:"#ecosystem",keywords:"system organs network"},
  {title:"Agency Explorer",description:"WHO, UNICEF, UNESCO, FAO, UNDP, UNEP and more.",icon:"🏢",target:"#agencies",keywords:"agency agencies who unicef unesco fao undp unep unhcr wfp imf world bank"},
  {title:"UN in Action",description:"Peace, human rights, humanitarian action and development.",icon:"🤝",target:"#work",keywords:"our work humanitarian rights development law"},
  {title:"Funding and Priorities Lab",description:"Allocate 100 cooperation points across global priorities.",icon:"💠",target:"#funding",keywords:"budget funding priorities allocation"},
  {title:"World Headquarters Map",description:"New York, Geneva, Vienna, Nairobi, Paris, Rome and The Hague.",icon:"🗺️",target:"#map",keywords:"map city headquarters offices new york geneva vienna nairobi paris rome hague"},
  {title:"193 Countries Explorer",description:"Search all UN Member States and broad geographic regions.",icon:"🌍",target:"#countries",keywords:"countries member states region flags"},
  {title:"Peacekeeping Centre",description:"Current missions and the peace process.",icon:"🕊️",target:"#peace",keywords:"peacekeeping missions blue helmets troops"},
  {title:"Global Situation Room",description:"Make coordinated decisions during international crises.",icon:"◈",target:"#situation-room",keywords:"situation crisis decision diplomacy response"},
  {title:"Sustainable Development Goals",description:"All 17 SDGs and official goal pages.",icon:"🎯",target:"#sdgs",keywords:"sdg goals climate poverty health education"},
  {title:"SDG City 2030",description:"Interactive future city connected to the global goals.",icon:"🏙️",target:"#sdg-city",keywords:"city future solar water school hospital"},
  {title:"Voting Simulators",description:"Security Council, General Assembly and Model UN activities.",icon:"⚖️",target:"#simulators",keywords:"vote voting veto resolution general assembly security council model un mun speech"},
  {title:"Photo Museum",description:"UN buildings, chambers and humanitarian work.",icon:"📷",target:"#gallery",keywords:"photos images headquarters chamber"},
  {title:"Interactive Chamber Tour",description:"Explore General Assembly and Security Council hotspots.",icon:"🏛️",target:"#chamber-tour",keywords:"chamber tour hotspot dais delegates interpretation"},
  {title:"India and the United Nations",description:"Founding membership, peacekeeping and SDG cooperation.",icon:"🇮🇳",target:"#india-un",keywords:"india indian peacekeepers hansa mehta"},
  {title:"UN History Timeline",description:"Milestones from 1945 to the Sustainable Development Goals.",icon:"🕰️",target:"#history",keywords:"history timeline 1945 human rights millennium"},
  {title:"International Days Calendar",description:"Selected UN observances throughout the year.",icon:"📅",target:"#international-days",keywords:"international days calendar un day peace day water day"},
  {title:"Knowledge Centre",description:"Glossary, decision pathway and official sources.",icon:"📚",target:"#knowledge",keywords:"glossary terms sources resolution process"},
  {title:"Learning Lab",description:"Quiz, AI guide, flag challenge, myths and certificate.",icon:"🎓",target:"#learning",keywords:"quiz game assistant certificate flag myth learn"},
  {title:"Diplomacy and Treaty Lab",description:"Build agreements and create agency response teams.",icon:"🤝",target:"#diplomacy-lab",keywords:"diplomacy treaty negotiation agencies response team"},
  {title:"Resolution Builder",description:"Create, print and download a formal educational draft resolution.",icon:"📝",target:"#resolution-builder",keywords:"resolution draft clauses sponsor committee"},
  {title:"UN Careers Explorer",description:"Discover roles, skills and a suggested UN career path.",icon:"🧭",target:"#careers",keywords:"careers jobs skills diplomat doctor legal translator data"}
];
function initMuseumSearch(){
  const overlay=$("#museumSearch"),input=$("#museumSearchInput");
  const openSearch=()=>{
    overlay.hidden=false;document.body.classList.add("no-scroll");setTimeout(()=>input.focus(),50);renderMuseumResults(input.value);
  };
  const closeSearch=()=>{overlay.hidden=true;document.body.classList.remove("no-scroll");};
  $("#museumSearchBtn")?.addEventListener("click",openSearch);
  $("#museumSearchClose")?.addEventListener("click",closeSearch);
  overlay?.addEventListener("click",e=>{if(e.target===overlay)closeSearch();});
  $("#museumSearchSuggestions")?.addEventListener("click",e=>{const b=e.target.closest("[data-search-query]");if(!b)return;input.value=b.dataset.searchQuery;renderMuseumResults(input.value);});
  input?.addEventListener("input",e=>renderMuseumResults(e.target.value));
  $("#museumSearchResults")?.addEventListener("click",e=>{
    const item=e.target.closest("[data-search-target]");if(!item)return;
    closeSearch();document.querySelector(item.dataset.searchTarget)?.scrollIntoView({behavior:"smooth"});
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="/"&&!/input|textarea|select/i.test(document.activeElement?.tagName)){e.preventDefault();openSearch();}
    if(e.key==="Escape"&&!overlay.hidden)closeSearch();
  });
}
function renderMuseumResults(query){
  const q=String(query||"").trim().toLowerCase();
  if(!q){$("#museumSearchResults").innerHTML=`<div class="search-empty"><span>⌕</span><p>Start typing to search the museum.</p></div>`;return;}
  const results=museumSearchIndex.filter(item=>`${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(q));
  $("#museumSearchResults").innerHTML=results.length?results.map(item=>`<button class="search-result" type="button" data-search-target="${item.target}"><span class="search-result-icon">${item.icon}</span><span><h4>${item.title}</h4><p>${item.description}</p></span><span>→</span></button>`).join(""):`<div class="search-empty"><span>⌕</span><p>No museum section found for “${escapeHTML(query)}”.</p></div>`;
}


function initAgencyComparison(){
  const aSelect=$("#compareAgencyA"),bSelect=$("#compareAgencyB");if(!aSelect||!bSelect)return;
  const options=DATA.agencies.map(a=>`<option value="${a.id}">${a.short} — ${a.name}</option>`).join("");
  aSelect.innerHTML=options;bSelect.innerHTML=options;
  aSelect.value="who";bSelect.value="unicef";
  const render=()=>{
    const a=DATA.agencies.find(x=>x.id===aSelect.value),b=DATA.agencies.find(x=>x.id===bSelect.value);if(!a||!b)return;
    $("#agencyCompareResults").innerHTML=[a,b].map(item=>`<article class="compare-column">
      <div class="compare-column-head"><div><p class="eyebrow">${item.category}</p><h4>${item.short}</h4></div><span>${item.icon}</span></div>
      <p>${item.name}</p>
      <div class="compare-facts"><div><b>FOUNDED</b><span>${item.year}</span></div><div><b>HEADQUARTERS</b><span>${item.hq}</span></div></div>
      <div class="compare-functions">${item.functions.map(f=>`<span>${f}</span>`).join("")}</div>
      <p class="muted">${item.achievement}</p><a class="text-link" href="${item.url}" target="_blank" rel="noopener">Official website →</a>
    </article>`).join("");
  };
  aSelect.addEventListener("change",render);bSelect.addEventListener("change",render);
  $("#swapAgencies").addEventListener("click",()=>{const x=aSelect.value;aSelect.value=bSelect.value;bSelect.value=x;render()});
  render();
}

const fundingLabels={peace:"Peace",health:"Health",education:"Education",climate:"Climate",humanitarian:"Relief"};
const fundingAgencyMap={
  peace:["Security Council","Peacekeeping","DPPA","Peacebuilding"],
  health:["WHO","UNICEF","UNFPA"],
  education:["UNESCO","UNICEF","UNHCR"],
  climate:["UNEP","UNDP","WMO","UN-Habitat"],
  humanitarian:["OCHA","WFP","UNHCR","UNICEF"]
};
function initFundingLab(){
  const sliders=$$("[data-fund]");if(!sliders.length)return;
  let lastChanged=sliders[0];
  const setValues=values=>{sliders.forEach(s=>{s.value=values[s.dataset.fund]??0});updateFunding()};
  const updateFunding=()=>{
    let total=sliders.reduce((sum,s)=>sum+Number(s.value),0);
    if(total>100){
      const excess=total-100;lastChanged.value=Math.max(0,Number(lastChanged.value)-excess);
      total=sliders.reduce((sum,s)=>sum+Number(s.value),0);
    }
    sliders.forEach(s=>s.closest("label").querySelector("output").value=s.value);
    $("#fundingUsed").textContent=total;$("#fundingRemaining").textContent=100-total;
    const values=Object.fromEntries(sliders.map(s=>[s.dataset.fund,Number(s.value)]));
    const ranked=Object.entries(values).sort((a,b)=>b[1]-a[1]);
    const top=ranked[0],balanced=Math.max(...Object.values(values))-Math.min(...Object.values(values))<=8;
    $("#fundingTitle").textContent=balanced?"Balanced global cooperation":`${fundingLabels[top[0]]}-focused plan`;
    $("#fundingDescription").textContent=balanced?"Your plan distributes attention broadly across five connected priorities.":`Your largest allocation supports ${fundingLabels[top[0]].toLowerCase()}, showing how priority choices shape the organizations and activities emphasized.`;
    $("#fundingBars").innerHTML=Object.entries(values).map(([key,value])=>`<div class="funding-bar"><label>${fundingLabels[key]}</label><span><i style="width:${value}%"></i></span><b>${value}</b></div>`).join("");
    const agencies=[...new Set(ranked.slice(0,2).flatMap(([key])=>fundingAgencyMap[key]))];
    $("#fundingAgencies").innerHTML=agencies.map(x=>`<span>${x}</span>`).join("");
  };
  sliders.forEach(s=>s.addEventListener("input",()=>{lastChanged=s;updateFunding()}));
  $("#balancedFunding").onclick=()=>setValues({peace:20,health:20,education:20,climate:20,humanitarian:20});
  $("#crisisFunding").onclick=()=>setValues({peace:15,health:20,education:10,climate:10,humanitarian:45});
  $("#resetFunding").onclick=()=>setValues({peace:20,health:20,education:20,climate:20,humanitarian:20});
  updateFunding();
}

function initCountryExplorer(){
  if(!$("#countryGrid"))return;
  const regions=["All","Africa","Americas","Asia","Europe","Oceania"];
  let region="All",query="",limit=24,selected="India";
  $("#countryRegionFilters").innerHTML=regions.map((r,i)=>`<button type="button" class="${i===0?"active":""}" data-country-region="${r}">${r}</button>`).join("");
  const filtered=()=>UN_COUNTRIES.filter(c=>(region==="All"||c.region===region)&&(!query||`${c.name} ${c.code} ${c.region}`.toLowerCase().includes(query)));
  const render=()=>{
    const list=filtered();$("#countryResultCount").textContent=`${list.length} ${list.length===1?"country":"countries"}`;
    $("#countryGrid").innerHTML=list.slice(0,limit).map(c=>`<button class="country-card ${c.name===selected?"active":""}" type="button" data-country-name="${escapeHTML(c.name)}"><span>${c.flag}</span><b>${c.name}</b><small>${c.region} • ${c.code}</small></button>`).join("");
    $("#countryLoadMore").hidden=limit>=list.length;
  };
  const spotlight=name=>{
    const c=UN_COUNTRIES.find(x=>x.name===name);if(!c)return;selected=c.name;
    $("#countrySpotlight").innerHTML=`<div class="country-flag-large">${c.flag}</div><p class="eyebrow">COUNTRY SPOTLIGHT</p><h3>${c.name}</h3><p>${c.name} is one of the 193 Member States represented in the United Nations General Assembly.</p>
      <div class="country-data-grid"><div><b>ISO CODE</b><span>${c.code}</span></div><div><b>DISPLAY REGION</b><span>${c.region}</span></div><div><b>GENERAL ASSEMBLY</b><span>One vote</span></div><div><b>MEMBERSHIP</b><span>UN Member State</span></div></div>
      <button class="button primary small" type="button" id="countryToGA">Use in GA Simulator</button>`;
    $("#countryToGA").onclick=()=>{state.gaSelectedCountry=c.name;$("#simulators").scrollIntoView({behavior:"smooth"});setTimeout(()=>{$("[data-sim='assemblySim']")?.click();renderGACountryOptions()},500)};
    render();
  };
  $("#countrySearch").addEventListener("input",e=>{query=e.target.value.toLowerCase().trim();limit=24;render()});
  $("#countryRegionFilters").addEventListener("click",e=>{const b=e.target.closest("[data-country-region]");if(!b)return;region=b.dataset.countryRegion;limit=24;$$("#countryRegionFilters button").forEach(x=>x.classList.toggle("active",x===b));render()});
  $("#countryGrid").addEventListener("click",e=>{const b=e.target.closest("[data-country-name]");if(b)spotlight(b.dataset.countryName)});
  $("#countryLoadMore").onclick=()=>{limit+=24;render()};
  $("#randomCountry").onclick=()=>{const list=filtered();if(list.length)spotlight(list[Math.floor(Math.random()*list.length)].name)};
  $("#regionDashboard").innerHTML=regions.slice(1).map(r=>{const count=UN_COUNTRIES.filter(c=>c.region===r).length;return`<article><b>${count}</b><span>${r}</span></article>`}).join("");
  spotlight(selected);render();
}

const munPositions=[
  ["Support ambitious international cooperation","Emphasize shared responsibility, technical assistance and practical implementation."],
  ["Protect vulnerable communities first","Focus on children, refugees, low-income communities and people living in crisis."],
  ["Prioritize national capacity-building","Request training, finance and technology so countries can implement commitments."],
  ["Balance development and environmental protection","Support action while recognizing different national circumstances and development needs."],
  ["Strengthen monitoring and accountability","Propose reporting, data-sharing and regular review of progress."]
];
function initMUNChallenge(){
  if(!$("#munCountry"))return;
  $("#munCountry").innerHTML=UN_COUNTRIES.map(c=>`<option value="${escapeHTML(c.name)}" ${c.name==="India"?"selected":""}>${c.flag} ${c.name}</option>`).join("");
  let seconds=60,timer=null,running=false;
  const renderTimer=()=>{const m=Math.floor(seconds/60),s=seconds%60;$("#munTimer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;$("#munTimer").classList.toggle("warning",seconds<=20&&seconds>10);$("#munTimer").classList.toggle("danger",seconds<=10)};
  const stop=()=>{clearInterval(timer);timer=null;running=false};
  $("#munStart").onclick=()=>{if(running||seconds<=0)return;running=true;timer=setInterval(()=>{seconds--;renderTimer();if(seconds<=0){stop();toast("Time! Conclude your speech.")}},1000)};
  $("#munPause").onclick=stop;
  $("#munReset").onclick=()=>{stop();seconds=60;renderTimer()};
  $("#munNewChallenge").onclick=()=>{const p=munPositions[Math.floor(Math.random()*munPositions.length)];$("#munPosition").innerHTML=`<p class="eyebrow">YOUR POSITION</p><h4>${p[0]}</h4><p>${p[1]}</p>`;$("#munTopic").selectedIndex=Math.floor(Math.random()*$("#munTopic").options.length);seconds=60;stop();renderTimer()};
  $("#munPrintCard").onclick=()=>{const country=$("#munCountry").value,topic=$("#munTopic").value,notes=$("#munNotes").value||"No notes entered.";const win=open("","_blank");if(!win){toast("Allow pop-ups to print the card.");return;}win.document.write(`<html><body style="font-family:Arial;padding:45px;border:12px solid #009edb"><h1>MODEL UNITED NATIONS DELEGATE CARD</h1><h2>${escapeHTML(country)}</h2><p><b>Topic:</b> ${escapeHTML(topic)}</p><h3>Speech Notes</h3><p style="white-space:pre-wrap">${escapeHTML(notes)}</p><hr><p>Tender Heart School • UN Ecosystem Exhibition 2026</p><script>onload=()=>print()<\/script></body></html>`);win.document.close()};
  renderTimer();$("#munNewChallenge").click();
}

const passportRooms=[
 ["charter","📜","Charter"],["ecosystem","🌐","Ecosystem"],["agencies","🏢","Agencies"],["work","🤝","UN Work"],
 ["funding","💠","Funding"],["map","🗺️","Map"],["countries","🌍","Countries"],["peace","🕊️","Peace"],["situation-room","◈","Situation"],
 ["sdgs","🎯","SDGs"],["sdg-city","🏙️","SDG City"],["simulators","⚖️","Voting"],["gallery","📷","Gallery"],["chamber-tour","🏛️","Chambers"],
 ["india-un","🇮🇳","India"],["history","🕰️","History"],["international-days","📅","UN Days"],["knowledge","📚","Knowledge"],["learning","🎓","Learning"],["diplomacy-lab","🤝","Diplomacy"],["resolution-builder","📝","Resolution"],["careers","🧭","Careers"]
];
const passportBadgeDefs=[
 ["explorer","🧭","UN Explorer","Visit four museum rooms",v=>v.length>=4],
 ["peacekeeper","🕊️","Peacekeeper","Visit the Peacekeeping Centre",v=>v.includes("peace")],
 ["diplomat","⚖️","Global Diplomat","Visit the Decision Chamber",v=>v.includes("simulators")],
 ["sdg","🎯","SDG Champion","Visit an SDG experience",v=>v.includes("sdgs")||v.includes("sdg-city")],
 ["researcher","📚","UN Researcher","Visit Countries or Knowledge Centre",v=>v.includes("countries")||v.includes("knowledge")],
 ["citizen","🌐","Global Citizen","Visit twelve museum rooms",v=>v.length>=12],
 ["solver","◈","Global Problem Solver","Visit the Global Situation Room",v=>v.includes("situation-room")],
 ["drafter","📝","Resolution Drafter","Visit the Resolution Builder",v=>v.includes("resolution-builder")]
];
function initMuseumPassport(){
  const panel=$("#passportPanel"),backdrop=$("#passportBackdrop");if(!panel)return;
  const getVisited=()=>JSON.parse(localStorage.getItem("unMuseumVisited")||"[]");
  const saveVisited=v=>localStorage.setItem("unMuseumVisited",JSON.stringify([...new Set(v)]));
  const open=()=>{panel.classList.add("open");panel.setAttribute("aria-hidden","false");backdrop.hidden=false;document.body.classList.add("no-scroll");render()};
  const close=()=>{panel.classList.remove("open");panel.setAttribute("aria-hidden","true");backdrop.hidden=true;document.body.classList.remove("no-scroll")};
  const render=()=>{const visited=getVisited();$("#passportCount").textContent=`${visited.length} / ${passportRooms.length} rooms`;$("#passportProgress").style.width=`${visited.length/passportRooms.length*100}%`;
    $("#passportStamps").innerHTML=passportRooms.map(([id,icon,label])=>`<div class="passport-stamp ${visited.includes(id)?"visited":""}"><span>${icon}</span><small>${label}</small></div>`).join("");
    $("#passportBadges").innerHTML=passportBadgeDefs.map(([id,icon,title,desc,test])=>`<div class="passport-badge ${test(visited)?"earned":""}"><span>${icon}</span><b>${title}</b><small>${desc}</small></div>`).join("");
  };
  $("#passportBtn")?.addEventListener("click",open);$("#passportClose").onclick=close;backdrop.onclick=close;
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const id=entry.target.id,visited=getVisited();if(id&&!visited.includes(id)){visited.push(id);saveVisited(visited);render();toast(`Passport stamped: ${passportRooms.find(r=>r[0]===id)?.[2]||id}`)}}})},{threshold:.35});
  passportRooms.forEach(([id])=>{const section=document.getElementById(id);if(section)observer.observe(section)});
  $("#resetPassport").onclick=()=>{if(confirm("Reset all museum passport progress?")){localStorage.removeItem("unMuseumVisited");render()}};
  $("#printPassport").onclick=()=>{const visited=getVisited(),earned=passportBadgeDefs.filter(x=>x[4](visited));const win=open("","_blank");if(!win){toast("Allow pop-ups to print the passport.");return;}win.document.write(`<html><body style="font-family:Arial;padding:45px;border:14px double #c9a755;text-align:center"><h1>UNITED NATIONS ECOSYSTEM</h1><h2>MUSEUM PASSPORT</h2><p>Rooms visited: ${visited.length}/${passportRooms.length}</p><h3>Stamps</h3><p>${passportRooms.filter(r=>visited.includes(r[0])).map(r=>`${r[1]} ${r[2]}`).join(" • ")||"No stamps yet"}</p><h3>Badges</h3><p>${earned.map(x=>`${x[1]} ${x[2]}`).join(" • ")||"Continue exploring to earn badges"}</p><br><b>Tender Heart School • Exhibition 2026</b><script>onload=()=>print()<\/script></body></html>`);win.document.close()};
  render();
}


const internationalDays=[
 [1,24,"International Day of Education","Education is a human right and a foundation for peace and sustainable development.","https://www.un.org/en/observances/education-day"],
 [2,20,"World Day of Social Justice","Promotes fairness, inclusion, employment and social protection.","https://www.un.org/en/observances/social-justice-day"],
 [3,8,"International Women's Day","Celebrates achievements and advances gender equality.","https://www.un.org/en/observances/womens-day"],
 [3,21,"International Day of Forests","Highlights the importance of forests and sustainable forest management.","https://www.un.org/en/observances/forests-and-trees-day"],
 [3,22,"World Water Day","Focuses attention on freshwater and sustainable water management.","https://www.un.org/en/observances/water-day"],
 [4,7,"World Health Day","Marks the founding of WHO and promotes global health awareness.","https://www.who.int/campaigns/world-health-day"],
 [4,22,"International Mother Earth Day","Encourages action to protect ecosystems and the planet.","https://www.un.org/en/observances/earth-day"],
 [5,22,"International Day for Biological Diversity","Raises awareness of biodiversity and ecosystem protection.","https://www.un.org/en/observances/biological-diversity-day"],
 [6,5,"World Environment Day","The UN's major global day for environmental awareness and action.","https://www.worldenvironmentday.global/"],
 [6,20,"World Refugee Day","Honours the strength and courage of refugees.","https://www.un.org/en/observances/refugee-day"],
 [7,15,"World Youth Skills Day","Promotes skills for employment, decent work and entrepreneurship.","https://www.un.org/en/observances/world-youth-skills-day"],
 [8,12,"International Youth Day","Highlights youth voices, participation and global challenges.","https://www.un.org/en/observances/youth-day"],
 [9,21,"International Day of Peace","Calls for non-violence, ceasefires and a culture of peace.","https://www.un.org/en/observances/international-day-peace"],
 [10,2,"International Day of Non-Violence","Observed on Mahatma Gandhi's birthday and promotes non-violence.","https://www.un.org/en/observances/non-violence-day"],
 [10,16,"World Food Day","Promotes action for food security, nutrition and sustainable agriculture.","https://www.fao.org/world-food-day/"],
 [10,24,"United Nations Day","Marks the anniversary of the UN Charter entering into force in 1945.","https://www.un.org/en/observances/un-day"],
 [11,20,"World Children's Day","Promotes children's rights and participation.","https://www.un.org/en/observances/world-childrens-day"],
 [12,3,"International Day of Persons with Disabilities","Promotes inclusion, accessibility and equal participation.","https://www.un.org/en/observances/day-of-persons-with-disabilities"],
 [12,10,"Human Rights Day","Marks the adoption of the Universal Declaration of Human Rights.","https://www.un.org/en/observances/human-rights-day"]
];
function initInternationalDays(){
  if(!$("#daysGrid"))return;
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  $("#daysMonthFilter").innerHTML=months.map((m,i)=>`<option value="${i+1}">${m}</option>`).join("");
  const current=new Date().getMonth()+1;$("#daysMonthFilter").value=current;
  const show=index=>{const d=internationalDays[index];if(!d)return;$("#daySpotlight").innerHTML=`<div class="day-date-large">${d[1]}</div><p class="eyebrow">${months[d[0]-1]}</p><h3>${d[2]}</h3><p>${d[3]}</p><a class="button primary small" href="${d[4]}" target="_blank" rel="noopener">Official Observance Page</a>`;$$("#daysGrid [data-day]").forEach(x=>x.classList.toggle("active",Number(x.dataset.day)===index))};
  const render=()=>{const month=Number($("#daysMonthFilter").value),items=internationalDays.map((d,i)=>({d,i})).filter(x=>x.d[0]===month);$("#daysGrid").innerHTML=items.length?items.map(({d,i})=>`<button class="day-card" type="button" data-day="${i}"><b>${d[1]}</b><span>${d[2]}</span><small>${months[d[0]-1]}</small></button>`).join(""):`<div class="search-empty"><p>No selected observances in this month.</p></div>`;if(items[0])show(items[0].i)};
  $("#daysGrid").addEventListener("click",e=>{const b=e.target.closest("[data-day]");if(b)show(Number(b.dataset.day))});
  $("#daysMonthFilter").addEventListener("change",render);$("#daysTodayBtn").onclick=()=>{$("#daysMonthFilter").value=current;render()};render();
}

const treatyChallenges=[
 {title:"Global Water Cooperation Accord",clauses:[["Shared data","Countries exchange river and groundwater data.",20,20,15,10],["Emergency access","Humanitarian teams receive rapid access during droughts and floods.",15,25,20,10],["Independent review","Progress is reviewed every two years.",15,15,20,25],["Technology transfer","Water-saving technology is shared with lower-capacity states.",20,25,15,15],["National discretion","Each state decides how targets apply nationally.",10,5,25,5],["Binding penalties","Failure triggers automatic economic penalties.",5,10,5,25]]},
 {title:"Climate Education Partnership",clauses:[["Teacher training","Joint programmes train teachers in climate education.",20,20,20,15],["Youth participation","Young people join national and international consultations.",20,25,15,15],["Annual reporting","Countries publish progress reports every year.",15,15,20,25],["Open resources","Learning materials are shared freely.",20,25,15,10],["Flexible targets","Countries set goals according to national capacity.",10,10,25,5],["Mandatory curriculum","Every school uses one common international curriculum.",10,10,5,20]]},
 {title:"Pandemic Preparedness Agreement",clauses:[["Early warning","Countries rapidly share outbreak information.",25,20,20,20],["Medical supply pool","Essential supplies are reserved for emergency distribution.",20,25,15,15],["Laboratory support","Technical assistance strengthens national laboratories.",20,20,20,15],["Review mechanism","Independent experts review preparedness.",15,15,15,25],["Border closure rule","Automatic border closure begins after any alert.",5,5,5,15],["National flexibility","Countries may adapt measures to local conditions.",10,10,25,5]]}
];
function initDiplomacyLab(){
  if(!$("#treatyCountryA"))return;
  const options=UN_COUNTRIES.map(c=>`<option value="${escapeHTML(c.name)}">${c.flag} ${c.name}</option>`).join("");
  $("#treatyCountryA").innerHTML=options;$("#treatyCountryB").innerHTML=options;$("#treatyCountryA").value="India";$("#treatyCountryB").value="Brazil";
  let index=0;
  const renderChallenge=()=>{const c=treatyChallenges[index];$("#treatyTitle").textContent=c.title;$("#treatyClauseList").innerHTML=c.clauses.map((cl,i)=>`<button class="treaty-clause" type="button" data-clause="${i}"><b>${cl[0]}</b><small>${cl[1]}</small></button>`).join("");$("#treatyScore").textContent="0";$("#treatyResultTitle").textContent="Build your agreement";$("#treatyResultText").textContent="Choose four clauses that balance cooperation, fairness, feasibility and accountability.";$("#treatyBalanceBars").innerHTML=""};
  $("#treatyClauseList").addEventListener("click",e=>{const b=e.target.closest("[data-clause]");if(!b)return;const active=$$("#treatyClauseList .active");if(!b.classList.contains("active")&&active.length>=4){toast("Choose a maximum of four clauses.");return}b.classList.toggle("active")});
  $("#newTreatyChallenge").onclick=()=>{index=(index+1)%treatyChallenges.length;renderChallenge()};
  $("#evaluateTreaty").onclick=()=>{const selected=$$("#treatyClauseList .active").map(b=>Number(b.dataset.clause));if(selected.length!==4){toast("Select exactly four clauses.");return}const c=treatyChallenges[index],tot=[0,0,0,0];selected.forEach(i=>c.clauses[i].slice(2).forEach((v,j)=>tot[j]+=v));const score=Math.round(tot.reduce((a,b)=>a+b,0)/4);$("#treatyScore").textContent=Math.min(100,score);$("#treatyResultTitle").textContent=score>=70?"Strong cooperative agreement":score>=55?"Promising but uneven agreement":"Agreement needs more balance";$("#treatyResultText").textContent=score>=70?"Your clauses combine cooperation, fairness, feasibility and accountability.":score>=55?"Your agreement has useful ideas but one or more principles are weak.":"Review your clauses and add stronger cooperation, fairness, feasibility or review mechanisms.";const labels=["Cooperation","Fairness","Feasibility","Accountability"];$("#treatyBalanceBars").innerHTML=labels.map((l,i)=>`<div class="treaty-balance-row"><label>${l}</label><span><i style="width:${Math.min(100,tot[i])}%"></i></span><b>${tot[i]}</b></div>`).join("")};
  $("#printTreaty").onclick=()=>{const c=treatyChallenges[index],clauses=$$("#treatyClauseList .active").map(b=>c.clauses[Number(b.dataset.clause)][0]);const win=open("","_blank");if(!win){toast("Allow pop-ups to print.");return;}win.document.write(`<html><body style="font-family:Arial;padding:45px"><h1>${escapeHTML(c.title)}</h1><p><b>Parties:</b> ${escapeHTML($("#treatyCountryA").value)} and ${escapeHTML($("#treatyCountryB").value)}</p><h2>Agreed Clauses</h2><ol>${clauses.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ol><h2>Final Statement</h2><p>${escapeHTML($("#treatyNotes").value||"The participating states commit to cooperation and review.")}</p><script>onload=()=>print()<\/script></body></html>`);win.document.close()};
  renderChallenge();

  const scenarios=[{icon:"🌊",title:"Severe regional flooding",needs:"Clean water, emergency health, food logistics and coordination.",answers:["OCHA","WHO","UNICEF","WFP"]},{icon:"🏕️",title:"Large refugee movement",needs:"Protection, registration, food, child services and health.",answers:["UNHCR","WFP","UNICEF","WHO"]},{icon:"🌾",title:"Food insecurity after drought",needs:"Agriculture, emergency food, nutrition and development recovery.",answers:["FAO","WFP","UNICEF","UNDP"]},{icon:"🦠",title:"Rapid disease outbreak",needs:"Health leadership, logistics, public information and child protection.",answers:["WHO","WFP","UNICEF","OCHA"]}];
  const agencies=["OCHA","WHO","UNICEF","WFP","UNHCR","FAO","UNDP","UNEP"];let scenario=0;
  const renderScenario=()=>{const s=scenarios[scenario];$("#responseScenario").innerHTML=`<span>${s.icon}</span><p class="eyebrow">SCENARIO</p><h4>${s.title}</h4><p>${s.needs}</p>`;$("#responseAgencyChoices").innerHTML=agencies.map(a=>`<button class="response-agency-choice" type="button" data-response-agency="${a}">${a}</button>`).join("");$("#responseTeamResult").innerHTML=`<span>?</span><h4>Build your response team</h4><p>Select four agencies that match the scenario.</p>`};
  $("#responseAgencyChoices").addEventListener("click",e=>{const b=e.target.closest("[data-response-agency]");if(!b)return;const active=$$("#responseAgencyChoices .active");if(!b.classList.contains("active")&&active.length>=4){toast("Choose four agencies.");return}b.classList.toggle("active")});
  $("#newResponseChallenge").onclick=()=>{scenario=(scenario+1)%scenarios.length;renderScenario()};
  $("#checkResponseTeam").onclick=()=>{const chosen=$$("#responseAgencyChoices .active").map(b=>b.dataset.responseAgency),correct=scenarios[scenario].answers,score=chosen.filter(x=>correct.includes(x)).length;$("#responseTeamResult").innerHTML=`<span>${score===4?"✅":score>=2?"🟡":"❌"}</span><h4>${score}/4 correct</h4><p>Recommended team: ${correct.join(", ")}.</p>`};
  renderScenario();
}

const mythStatements=[
 ["The General Assembly has 193 Member States.",true,"Every UN Member State participates in the General Assembly."],
 ["Every General Assembly resolution is legally binding on all countries.",false,"Most General Assembly resolutions are recommendations, although they can carry political importance."],
 ["The Security Council has 15 members.",true,"It has five permanent and ten elected members."],
 ["UN peacekeepers are only soldiers.",false,"Peacekeeping missions also include police and civilian personnel."],
 ["The ICJ is located in New York.",false,"The International Court of Justice is located in The Hague."],
 ["There are 17 Sustainable Development Goals.",true,"The 17 SDGs were adopted in 2015."],
 ["WHO is the UN agency for global public health.",true,"WHO coordinates international public-health work."],
 ["A veto can be used by any UN Member State.",false,"Only the five permanent Security Council members have veto power on substantive Council decisions."]
];
function initAdvancedGames(){
  if(!$("#flagQuestion"))return;
  let flagScore=0,current=null,locked=false;
  const newFlag=()=>{locked=false;current=UN_COUNTRIES[Math.floor(Math.random()*UN_COUNTRIES.length)];const distractors=UN_COUNTRIES.filter(c=>c.name!==current.name).sort(()=>Math.random()-.5).slice(0,3);const choices=[current,...distractors].sort(()=>Math.random()-.5);$("#flagQuestion").textContent=current.flag;$("#flagChoices").innerHTML=choices.map(c=>`<button type="button" data-flag-country="${escapeHTML(c.name)}">${c.name}</button>`).join("");$("#flagFeedback").textContent="Choose the correct country."};
  $("#flagChoices").addEventListener("click",e=>{const b=e.target.closest("[data-flag-country]");if(!b||locked)return;locked=true;const ok=b.dataset.flagCountry===current.name;if(ok){flagScore++;b.classList.add("correct");$("#flagFeedback").textContent="Correct!"}else{b.classList.add("wrong");$$("#flagChoices button").find(x=>x.dataset.flagCountry===current.name)?.classList.add("correct");$("#flagFeedback").textContent=`Correct answer: ${current.name}.`}$("#flagScore").textContent=flagScore});
  $("#nextFlag").onclick=newFlag;newFlag();

  let mythIndex=0,mythScore=0,mythLocked=false;
  const showMyth=()=>{mythLocked=false;const m=mythStatements[mythIndex];$("#mythStatement").textContent=m[0];$("#mythExplanation").textContent="Choose Fact or Myth."};
  const answer=value=>{if(mythLocked)return;mythLocked=true;const m=mythStatements[mythIndex],ok=value===m[1];if(ok)mythScore++;$("#mythScore").textContent=mythScore;$("#mythExplanation").textContent=`${ok?"Correct.":"Not quite."} ${m[2]}`};
  $("#mythFact").onclick=()=>answer(true);$("#mythMyth").onclick=()=>answer(false);$("#nextMyth").onclick=()=>{mythIndex=(mythIndex+1)%mythStatements.length;showMyth()};showMyth();

  let rating=0;
  $("#feedbackStars").addEventListener("click",e=>{const b=e.target.closest("[data-rating]");if(!b)return;rating=Number(b.dataset.rating);$$("#feedbackStars button").forEach(x=>x.classList.toggle("active",Number(x.dataset.rating)<=rating))});
  $("#saveFeedback").onclick=()=>{if(!rating){toast("Choose a star rating.");return}const items=JSON.parse(localStorage.getItem("unMuseumFeedback")||"[]");items.push({rating,text:$("#feedbackText").value.trim(),date:new Date().toISOString()});localStorage.setItem("unMuseumFeedback",JSON.stringify(items));$("#feedbackMessage").textContent="Thank you. Feedback saved on this device.";$("#feedbackText").value="";rating=0;$$("#feedbackStars button").forEach(x=>x.classList.remove("active"));updateTeacherStats()};
  $("#exportTeacherReport").onclick=exportTeacherReport;updateTeacherStats();
}
function updateTeacherStats(){
  const visited=JSON.parse(localStorage.getItem("unMuseumVisited")||"[]"),feedback=JSON.parse(localStorage.getItem("unMuseumFeedback")||"[]"),badges=passportBadgeDefs.filter(x=>x[4](visited)).length;
  if($("#teacherVisits"))$("#teacherVisits").textContent=visited.length;
  if($("#teacherBadges"))$("#teacherBadges").textContent=badges;
  if($("#teacherFeedbackCount"))$("#teacherFeedbackCount").textContent=feedback.length;
}
function exportTeacherReport(){
  const visited=JSON.parse(localStorage.getItem("unMuseumVisited")||"[]"),feedback=JSON.parse(localStorage.getItem("unMuseumFeedback")||"[]"),badges=passportBadgeDefs.filter(x=>x[4](visited)).map(x=>x[2]);
  const rows=[["Metric","Value"],["Rooms visited",visited.join("; ")],["Badges earned",badges.join("; ")],["Feedback count",feedback.length],...feedback.map((f,i)=>[`Feedback ${i+1}`,`${f.rating} stars - ${f.text||"No comment"}`])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="UN_Museum_Teacher_Report.csv";a.click();URL.revokeObjectURL(a.href);
}
function initNarration(){
  $("#narrationBtn")?.addEventListener("click",()=>{
    if(!("speechSynthesis" in window)){toast("Narration is not supported in this browser.");return}
    speechSynthesis.cancel();
    const sections=$$("main section[id]");let current=sections[0];
    sections.forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.45)current=s});
    const heading=current.querySelector("h2,h1"),paragraph=current.querySelector(".section-heading p:last-child,.hero-lead,p");
    const text=[heading?.textContent,paragraph?.textContent].filter(Boolean).join(". ");
    const u=new SpeechSynthesisUtterance(text);
    u.lang=languageLocale();u.rate=.95;
    u.onstart=()=>duckMusicForNarration(true);
    u.onend=()=>duckMusicForNarration(false);
    u.onerror=()=>duckMusicForNarration(false);
    speechSynthesis.speak(u);toast("Narrating current section.");
  });
}


const situationScenarios=[
 {id:"cyclone",icon:"🌀",title:"Severe Cyclone Emergency",text:"A powerful cyclone has affected several coastal regions. Transport, hospitals and clean-water systems are under pressure.",needs:["Emergency shelter","Health services","Clean water","Logistics"],stages:[
  {title:"Immediate response",prompt:"What should happen first?",options:[["Activate coordinated needs assessment",[4,8,7]],["Wait for complete national reports",[2,2,2]],["Send uncoordinated supplies immediately",[1,5,1]]]},
  {title:"Regional coordination",prompt:"How should neighbouring countries cooperate?",options:[["Share weather, transport and medical data",[5,5,8]],["Close information channels",[0,2,0]],["Create a joint logistics corridor",[4,7,8]]]},
  {title:"Recovery",prompt:"What should be included after emergency relief?",options:[["Resilient infrastructure and local recovery",[4,7,7]],["End the response after supplies arrive",[1,2,1]],["Community-led rebuilding with climate planning",[5,8,8]]]}]},
 {id:"tension",icon:"🕊️",title:"Rising Border Tension",text:"Two neighbouring states report military tension and hostile public statements. Civilians near the border are concerned.",needs:["Diplomacy","Civilian protection","Verified information","De-escalation"],stages:[
  {title:"First diplomatic step",prompt:"What should the international response prioritize?",options:[["Offer quiet mediation and direct communication",[9,5,8]],["Publicly blame one side before verification",[0,2,1]],["Ignore the situation until violence begins",[0,0,0]]]},
  {title:"Civilian protection",prompt:"How should risk to communities be reduced?",options:[["Support monitoring and humanitarian access",[7,9,7]],["Share unverified rumours",[0,0,0]],["Create local emergency contact mechanisms",[6,8,7]]]},
  {title:"Long-term outcome",prompt:"What can reduce renewed tension?",options:[["Negotiated confidence-building measures",[9,6,9]],["Permanent suspension of communication",[0,2,0]],["Joint border and resource dialogue",[8,6,9]]]}]},
 {id:"pandemic",icon:"🦠",title:"Cross-Border Disease Outbreak",text:"A fast-spreading disease is reported in several countries. Hospitals need information, supplies and coordinated public guidance.",needs:["Surveillance","Health care","Public information","Supply chains"],stages:[
  {title:"Early warning",prompt:"What information policy is strongest?",options:[["Rapid transparent reporting to health authorities",[6,8,9]],["Delay reporting to avoid concern",[1,1,0]],["Publish unverified numbers",[0,2,1]]]},
  {title:"Medical coordination",prompt:"How should scarce supplies be managed?",options:[["Needs-based distribution and shared logistics",[5,9,8]],["First-come, first-served purchasing only",[1,3,1]],["Regional medical supply pool",[6,8,9]]]},
  {title:"Recovery",prompt:"What builds future preparedness?",options:[["Laboratories, training and universal access",[5,8,8]],["Stop cooperation after the outbreak declines",[1,2,1]],["Independent review and improved early warning",[6,7,9]]]}]},
 {id:"food",icon:"🌾",title:"Regional Food-Security Crisis",text:"Drought, disrupted markets and rising prices have increased hunger across several communities.",needs:["Emergency food","Agriculture","Nutrition","Market recovery"],stages:[
  {title:"Immediate needs",prompt:"What should be assessed first?",options:[["Food access, nutrition and vulnerable groups",[4,9,7]],["National averages only",[2,2,2]],["Ignore local market conditions",[0,1,0]]]},
  {title:"Delivery",prompt:"How can assistance avoid harming local markets?",options:[["Combine food, cash and local procurement",[5,8,8]],["Import everything without assessment",[1,4,2]],["Coordinate logistics and farmer support",[5,7,8]]]},
  {title:"Resilience",prompt:"What supports long-term food security?",options:[["Climate-resilient agriculture and social protection",[5,8,8]],["Emergency aid only",[1,4,2]],["Water management, data and rural livelihoods",[5,7,9]]]}]}
];

let situationState={scenario:0,choices:{}};
function initSituationRoom(){
  if(!$("#situationTabs"))return;
  $("#situationTabs").innerHTML=situationScenarios.map((s,i)=>`<button type="button" class="${i===0?"active":""}" data-situation="${i}">${s.icon} ${s.title}</button>`).join("");
  $("#situationTabs").addEventListener("click",e=>{const b=e.target.closest("[data-situation]");if(!b)return;situationState={scenario:Number(b.dataset.situation),choices:{}};renderSituation()});
  $("#situationDecisionGrid").addEventListener("click",e=>{const b=e.target.closest("[data-stage-option]");if(!b)return;const stage=Number(b.dataset.stage),option=Number(b.dataset.stageOption);situationState.choices[stage]=option;$$(`[data-stage="${stage}"] [data-stage-option]`).forEach(x=>x.classList.toggle("active",x===b));updateSituationScores(false)});
  $("#evaluateSituation").onclick=()=>updateSituationScores(true);
  $("#resetSituation").onclick=()=>{situationState.choices={};renderSituation()};
  renderSituation();
}
function renderSituation(){
  const s=situationScenarios[situationState.scenario];
  $$("#situationTabs [data-situation]").forEach(x=>x.classList.toggle("active",Number(x.dataset.situation)===situationState.scenario));
  $("#situationIcon").textContent=s.icon;$("#situationTitle").textContent=s.title;$("#situationText").textContent=s.text;
  $("#situationNeeds").innerHTML=s.needs.map(x=>`<span>${x}</span>`).join("");
  $("#situationDecisionGrid").innerHTML=s.stages.map((stage,i)=>`<article class="decision-stage" data-stage="${i}"><span>${i+1}</span><h4>${stage.title}</h4><p>${stage.prompt}</p><div class="decision-options">${stage.options.map((o,j)=>`<button type="button" data-stage="${i}" data-stage-option="${j}">${o[0]}</button>`).join("")}</div></article>`).join("");
  $("#situationPeace").textContent="0";$("#situationProtection").textContent="0";$("#situationCooperation").textContent="0";
  $("#situationOutcome").innerHTML=`<span>◌</span><div><p class="eyebrow">OUTCOME PENDING</p><h3>Complete all three decisions</h3><p>Your coordination assessment will appear here.</p></div>`;
}
function updateSituationScores(final){
  const s=situationScenarios[situationState.scenario],totals=[0,0,0];
  Object.entries(situationState.choices).forEach(([stage,option])=>s.stages[stage].options[option][1].forEach((v,i)=>totals[i]+=v));
  $("#situationPeace").textContent=totals[0];$("#situationProtection").textContent=totals[1];$("#situationCooperation").textContent=totals[2];
  if(!final)return;
  if(Object.keys(situationState.choices).length<3){toast("Complete all three decisions first.");return}
  const score=totals.reduce((a,b)=>a+b,0),strong=score>=58,medium=score>=40;
  $("#situationOutcome").innerHTML=`<span>${strong?"✅":medium?"🟡":"⚠️"}</span><div><p class="eyebrow">COORDINATION ASSESSMENT</p><h3>${strong?"Strong multilateral response":medium?"Partial response — improvements needed":"High risk of an ineffective response"}</h3><p>${strong?"Your choices combine timely action, protection and cooperation.":medium?"Some decisions help, but coordination or protection remains weak.":"The response lacks enough verified information, protection or international coordination."}</p></div>`;
  if(strong){launchConfetti();localStorage.setItem("unSituationCompleted","true")}
}

const chamberData={
 ga:{photo:"assets/photos/general_assembly.jpg",alt:"General Assembly Hall",title:"General Assembly Hall",hotspots:[
  {x:50,y:34,label:"President's Dais",text:"The President of the General Assembly presides over meetings, recognizes speakers and announces decisions.",facts:["President's chair","Secretary-General's place","Meeting officers"]},
  {x:48,y:66,label:"Delegate Seating",text:"Delegations of all 193 Member States sit in the hall. Each Member State has one vote.",facts:["Country nameplates","Delegation desks","One state, one vote"]},
  {x:17,y:31,label:"Interpretation Booths",text:"Interpreters support multilingual meetings in the six official UN languages.",facts:["Simultaneous interpretation","Six official languages","Headsets at desks"]},
  {x:81,y:21,label:"Public and Media Galleries",text:"Accredited visitors, media and observers can follow proceedings from designated galleries.",facts:["Press coverage","Observers","Public diplomacy"]}]},
 sc:{photo:"assets/photos/security_council.jpg",alt:"Security Council Chamber",title:"Security Council Chamber",hotspots:[
  {x:48,y:53,label:"Council Table",text:"The 15 members meet around the central table to discuss threats to international peace and security.",facts:["15 members","Five permanent","Ten elected"]},
  {x:50,y:22,label:"Council Presidency",text:"The Council presidency rotates monthly among members in English alphabetical order.",facts:["Monthly rotation","Meeting management","Council programme"]},
  {x:74,y:37,label:"Delegation Seats",text:"Council delegations include diplomats and experts who negotiate draft resolutions and statements.",facts:["Negotiation","Draft texts","Expert advisers"]},
  {x:23,y:27,label:"Interpretation and Support",text:"Language, conference and Secretariat staff support formal meetings.",facts:["Interpretation","Meeting records","Secretariat support"]}]}
};
let chamberKey="ga";
function initChamberTour(){
  if(!$("#chamberTabs"))return;
  $("#chamberTabs").addEventListener("click",e=>{const b=e.target.closest("[data-chamber]");if(!b)return;chamberKey=b.dataset.chamber;renderChamber()});
  $("#chamberHotspots").addEventListener("click",e=>{const b=e.target.closest("[data-hotspot]");if(!b)return;showChamberHotspot(Number(b.dataset.hotspot))});
  renderChamber();
}
function renderChamber(){
  const c=chamberData[chamberKey];$("#chamberPhoto").src=c.photo;$("#chamberPhoto").alt=c.alt;
  $$("#chamberTabs [data-chamber]").forEach(x=>x.classList.toggle("active",x.dataset.chamber===chamberKey));
  $("#chamberHotspots").innerHTML=c.hotspots.map((h,i)=>`<button class="chamber-hotspot" type="button" style="left:${h.x}%;top:${h.y}%" data-hotspot="${i}" aria-label="${h.label}">${i+1}</button>`).join("");
  $("#chamberInfo").innerHTML=`<p class="eyebrow">SELECT A HOTSPOT</p><h3>${c.title}</h3><p>Tap a glowing marker to learn how the chamber functions.</p>`;
}
function showChamberHotspot(index){
  const c=chamberData[chamberKey],h=c.hotspots[index];if(!h)return;
  $$("#chamberHotspots [data-hotspot]").forEach(x=>x.classList.toggle("active",Number(x.dataset.hotspot)===index));
  $("#chamberInfo").innerHTML=`<p class="eyebrow">${c.title}</p><h3>${h.label}</h3><p>${h.text}</p><div class="chamber-info-list">${h.facts.map(x=>`<span>${x}</span>`).join("")}</div>`;
}

const preambularLibrary=[
 "Guided by the purposes and principles of the Charter of the United Nations",
 "Recalling the 2030 Agenda for Sustainable Development",
 "Recognizing the important role of young people and local communities",
 "Deeply concerned by unequal access to knowledge, technology and public services",
 "Acknowledging the different capacities and circumstances of Member States",
 "Emphasizing the importance of international cooperation and shared responsibility"
];
const operativeLibrary=[
 "Encourages Member States to develop inclusive national action plans",
 "Calls upon relevant UN entities to provide technical assistance upon request",
 "Invites international and regional organizations to share research and good practices",
 "Recommends the creation of voluntary progress reports and review meetings",
 "Requests the Secretary-General to present an implementation report",
 "Urges stronger participation by youth, educators and civil-society organizations",
 "Supports partnerships that improve access to finance, technology and training",
 "Decides to include the matter in the provisional agenda of its next session"
];
function initResolutionBuilder(){
  if(!$("#resolutionSponsor"))return;
  $("#resolutionSponsor").innerHTML=UN_COUNTRIES.map(c=>`<option value="${escapeHTML(c.name)}" ${c.name==="India"?"selected":""}>${c.flag} ${c.name}</option>`).join("");
  $("#preambularClauses").innerHTML=preambularLibrary.map((x,i)=>`<button class="clause-choice ${i<3?"active":""}" type="button" data-pre="${i}">${x}</button>`).join("");
  $("#operativeClauses").innerHTML=operativeLibrary.map((x,i)=>`<button class="clause-choice ${i<4?"active":""}" type="button" data-op="${i}">${x}</button>`).join("");
  const toggle=e=>{const b=e.target.closest(".clause-choice");if(b){b.classList.toggle("active");renderResolution()}};
  $("#preambularClauses").addEventListener("click",toggle);$("#operativeClauses").addEventListener("click",toggle);
  ["resolutionCommittee","resolutionSponsor","resolutionTopic","resolutionCosponsors","customClause"].forEach(id=>$("#"+id).addEventListener("input",renderResolution));
  $("#resolutionImprove").onclick=()=>{const input=$("#customClause");let v=input.value.trim();if(!v){input.value="Calls upon Member States to strengthen cooperation, share good practices and report voluntarily on progress";}else{v=v.replace(/\.$/,"");input.value=v.charAt(0).toUpperCase()+v.slice(1)}renderResolution();toast("Wording polished for formal presentation.")};
  $("#resolutionDownload").onclick=downloadResolution;$("#resolutionPrint").onclick=printResolution;renderResolution();
}
function selectedResolutionData(){
  const pre=$$("#preambularClauses .active").map(b=>preambularLibrary[Number(b.dataset.pre)]);
  const op=$$("#operativeClauses .active").map(b=>operativeLibrary[Number(b.dataset.op)]);
  const custom=$("#customClause").value.trim();if(custom)op.push(custom);
  return{committee:$("#resolutionCommittee").value,sponsor:$("#resolutionSponsor").value,topic:$("#resolutionTopic").value.trim()||"Untitled draft resolution",cosponsors:$("#resolutionCosponsors").value.trim()||"—",pre,op};
}
function renderResolution(){
  const d=selectedResolutionData();$("#resolutionPreviewCommittee").textContent=d.committee;$("#resolutionPreviewTitle").textContent=d.topic;$("#resolutionPreviewSponsor").textContent=d.sponsor;$("#resolutionPreviewCosponsors").textContent=d.cosponsors;
  $("#resolutionPreambularPreview").innerHTML=d.pre.length?d.pre.map((x,i)=>`<li>${escapeHTML(x)}${i===d.pre.length-1?";":","}</li>`).join(""):"<li>No preambular clauses selected;</li>";
  $("#resolutionOperativePreview").innerHTML=d.op.length?d.op.map((x,i)=>`<li>${escapeHTML(x)}${i===d.op.length-1?".":";"}</li>`).join(""):"<li>No operative clauses selected.</li>";
}
function resolutionText(){
  const d=selectedResolutionData();
  return `${d.committee}\nA/EXHIBITION/2026/L.1\n\n${d.topic}\n\nThe General Assembly,\n\n${d.pre.map((x,i)=>`${i+1}. ${x}${i===d.pre.length-1?";":","}`).join("\n")}\n\n${d.op.map((x,i)=>`${i+1}. ${x}${i===d.op.length-1?".":";"}`).join("\n")}\n\nPrimary sponsor: ${d.sponsor}\nCo-sponsors: ${d.cosponsors}`;
}
function downloadResolution(){const blob=new Blob([resolutionText()],{type:"text/plain"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="UN_Exhibition_Draft_Resolution.txt";a.click();URL.revokeObjectURL(a.href);localStorage.setItem("unResolutionBuilt","true");launchConfetti()}
function printResolution(){const d=selectedResolutionData(),win=open("","_blank");if(!win){toast("Allow pop-ups to print.");return}win.document.write(`<html><body style="font-family:Georgia;padding:50px;max-width:800px;margin:auto"><h4>${escapeHTML(d.committee)}</h4><h1>${escapeHTML(d.topic)}</h1><p><i>The General Assembly,</i></p><ol>${d.pre.map(x=>`<li style="margin:12px 0"><i>${escapeHTML(x)},</i></li>`).join("")}</ol><ol>${d.op.map(x=>`<li style="margin:12px 0">${escapeHTML(x)};</li>`).join("")}</ol><hr><p>Primary sponsor: ${escapeHTML(d.sponsor)}</p><p>Co-sponsors: ${escapeHTML(d.cosponsors)}</p><script>onload=()=>print()<\/script></body></html>`);win.document.close();localStorage.setItem("unResolutionBuilt","true")}

const careerRoles=[
 {id:"diplomacy",icon:"🤝",title:"Political Affairs Officer",text:"Analyzes conflicts, supports mediation and prepares briefings for diplomatic decision-making.",skills:["History","Writing","Negotiation"]},
 {id:"health",icon:"🏥",title:"Public Health Specialist",text:"Supports disease prevention, health systems, emergency response and scientific guidance.",skills:["Biology","Data","Communication"]},
 {id:"humanitarian",icon:"⛑️",title:"Humanitarian Coordinator",text:"Organizes relief partners, assesses needs and helps assistance reach affected communities.",skills:["Organization","Empathy","Leadership"]},
 {id:"environment",icon:"🌿",title:"Environmental Scientist",text:"Studies climate, ecosystems and pollution and helps design sustainable policies.",skills:["Science","Research","Geography"]},
 {id:"data",icon:"📊",title:"Data and Technology Officer",text:"Uses statistics, maps and digital systems to improve decisions and programme delivery.",skills:["Mathematics","Coding","Analysis"]},
 {id:"language",icon:"🗣️",title:"Interpreter or Translator",text:"Makes multilingual diplomacy possible by accurately communicating complex ideas.",skills:["Languages","Listening","Precision"]},
 {id:"law",icon:"⚖️",title:"Legal Officer",text:"Researches international law, treaties, institutions and formal legal questions.",skills:["Civics","Reasoning","Writing"]},
 {id:"field",icon:"🕊️",title:"Civil Affairs Officer",text:"Works with communities and institutions in peace operations to strengthen dialogue and trust.",skills:["Teamwork","Culture","Problem solving"]}
];
const careerQuestions=[
 {q:"Which activity interests you most?",answers:[["Negotiating solutions","diplomacy"],["Helping during emergencies","humanitarian"],["Studying science and health","health"],["Working with data and technology","data"]]},
 {q:"Which school subject do you enjoy most?",answers:[["History or civics","law"],["Biology or chemistry","health"],["Mathematics or computer science","data"],["Languages","language"]]},
 {q:"Where would you prefer to work?",answers:[["Diplomatic meetings","diplomacy"],["Communities affected by crisis","field"],["Laboratory or research office","environment"],["Operations and coordination centre","humanitarian"]]},
 {q:"Which strength describes you?",answers:[["Careful communication","language"],["Logical reasoning","law"],["Team leadership","humanitarian"],["Investigating evidence","data"]]},
 {q:"Which global issue motivates you?",answers:[["Peace and conflict prevention","field"],["Climate and nature","environment"],["Public health","health"],["International cooperation","diplomacy"]]}
];
function initCareerExplorer(){
  if(!$("#careerGrid"))return;
  $("#careerGrid").innerHTML=careerRoles.map(r=>`<article class="career-card" data-career="${r.id}"><span>${r.icon}</span><h3>${r.title}</h3><p>${r.text}</p><div class="career-skills">${r.skills.map(x=>`<small>${x}</small>`).join("")}</div></article>`).join("");
  $("#careerGrid").addEventListener("click",e=>{const card=e.target.closest("[data-career]");if(!card)return;const r=careerRoles.find(x=>x.id===card.dataset.career);$$("#careerGrid [data-career]").forEach(x=>x.classList.toggle("active",x===card));$("#careerResult").innerHTML=`<span>${r.icon}</span><p class="eyebrow">ROLE PROFILE</p><h3>${r.title}</h3><p>${r.text}</p><div class="career-path">${r.skills.map(x=>`<span>${x}</span>`).join("")}</div>`});
  let qIndex=0,scores={};
  const renderQ=()=>{const q=careerQuestions[qIndex];$("#careerQuizMeta").textContent=`Question ${qIndex+1} of ${careerQuestions.length}`;$("#careerQuizProgress").style.width=`${qIndex/careerQuestions.length*100}%`;$("#careerQuestion").textContent=q.q;$("#careerAnswers").innerHTML=q.answers.map(a=>`<button type="button" data-career-answer="${a[1]}">${a[0]}</button>`).join("")};
  $("#careerAnswers").addEventListener("click",e=>{const b=e.target.closest("[data-career-answer]");if(!b)return;scores[b.dataset.careerAnswer]=(scores[b.dataset.careerAnswer]||0)+1;qIndex++;if(qIndex<careerQuestions.length)renderQ();else{const best=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]?.[0]||"diplomacy",r=careerRoles.find(x=>x.id===best);$("#careerQuizProgress").style.width="100%";$("#careerQuestion").textContent="Career quiz complete";$("#careerAnswers").innerHTML=`<button type="button" id="careerRestart">Restart Quiz</button>`;$("#careerResult").innerHTML=`<span>${r.icon}</span><p class="eyebrow">YOUR SUGGESTED ROLE</p><h3>${r.title}</h3><p>${r.text}</p><div class="career-path">${r.skills.map(x=>`<span>${x}</span>`).join("")}</div>`;$("#careerRestart").onclick=()=>{qIndex=0;scores={};renderQ()};launchConfetti()}});
  renderQ();
}

const dailyChallenges=[
 {title:"Act as a diplomat",text:"Complete the Global Situation Room and achieve a strong multilateral response.",target:"#situation-room"},
 {title:"Draft a resolution",text:"Build and download an educational UN resolution.",target:"#resolution-builder"},
 {title:"Explore a chamber",text:"Open every hotspot in either the General Assembly or Security Council tour.",target:"#chamber-tour"},
 {title:"Discover your role",text:"Complete the UN Careers quiz.",target:"#careers"},
 {title:"Test your knowledge",text:"Finish one Easy, Medium or Hard quiz.",target:"#learning"},
 {title:"Represent a country",text:"Select a country and use it in the General Assembly voting simulator.",target:"#countries"}
];
function initDailyChallenge(){
  if(!$("#dailyChallenge"))return;
  const day=Math.floor(new Date().setHours(0,0,0,0)/86400000),challenge=dailyChallenges[day%dailyChallenges.length],key=`unDailyChallenge-${day}`;
  $("#dailyChallengeTitle").textContent=challenge.title;$("#dailyChallengeText").textContent=challenge.text;
  $("#dailyChallengeGo").onclick=()=>document.querySelector(challenge.target)?.scrollIntoView({behavior:"smooth"});
  const update=()=>{const done=localStorage.getItem(key)==="true";$("#dailyChallengeComplete").textContent=done?"Completed ✓":"Mark Complete";$("#dailyChallengeComplete").disabled=done};
  $("#dailyChallengeComplete").onclick=()=>{localStorage.setItem(key,"true");launchConfetti();toast("Daily challenge completed!");update()};update();
}
function launchConfetti(){
  const layer=$("#celebrationLayer");if(!layer)return;
  for(let i=0;i<42;i++){const piece=document.createElement("i");piece.className="confetti-piece";piece.style.left=`${Math.random()*100}%`;piece.style.setProperty("--hue",Math.floor(Math.random()*360));piece.style.setProperty("--duration",`${2.5+Math.random()*2.4}s`);piece.style.setProperty("--drift",`${-90+Math.random()*180}px`);piece.style.setProperty("--rotation",`${Math.random()*360}deg`);layer.appendChild(piece);setTimeout(()=>piece.remove(),5200)}
}
function initNewSectionJumps(){
  $$("[data-section-jump]").forEach(b=>b.addEventListener("click",()=>{$("#mainNav")?.classList.remove("open");document.querySelector(b.dataset.sectionJump)?.scrollIntoView({behavior:"smooth"})}));
}

function initTilt(){
  if(TEST_MODE||matchMedia("(pointer:coarse)").matches)return;
  $$(".agency-card,.organ-card,.gallery-card,.game-card").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateX(${y*-3}deg) rotateY(${x*4}deg) translateY(-5px)`;
    });
    card.addEventListener("pointerleave",()=>card.style.transform="");
  });
}

safe(initReveal);safe(initScrollUI);safe(initCounters);safe(initNavigation);safe(initLanguage);
safe(initEcosystem);safe(initAgencies);safe(initMap);safe(initPeace);safe(initSDGs);
safe(initSimulators);safe(initGallery);safe(initLearning);safe(initSound);safe(initModal);
safe(initTour);safe(initPresentation);safe(initFloatingAI);safe(initMobileNavigation);safe(initPerformanceMode);safe(initBackToTop);safe(initHeroRoomStrip);safe(initAgencyComparison);safe(initFundingLab);safe(initCountryExplorer);safe(initMUNChallenge);safe(initMuseumPassport);safe(initInternationalDays);safe(initDiplomacyLab);safe(initAdvancedGames);safe(initNarration);safe(initSituationRoom);safe(initChamberTour);safe(initResolutionBuilder);safe(initCareerExplorer);safe(initDailyChallenge);safe(initNewSectionJumps);safe(initCharterValues);safe(initUNWork);safe(initKnowledgeCentre);safe(initMuseumSearch);safe(initSDGCity);safe(initIndiaUN);safe(initPWA);safe(initUtilityPanels);safe(initKioskAndAutoTour);safe(initTilt);

document.body.dataset.appReady="true";
})();