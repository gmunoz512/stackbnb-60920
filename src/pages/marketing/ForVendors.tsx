import { PartnerPage } from "@/components/marketing/PartnerPage";
import hero from "@/assets/experiences/kayaking-2.jpg";
import horseback from "@/assets/experiences/horseback.jpg";
import yoga from "@/assets/experiences/yoga.jpg";
import scuba from "@/assets/experiences/scuba.jpg";

export default function ForVendors() {
  return (
    <PartnerPage
      audience="For guides, tour operators and restaurants"
      title="Get recommended by the hosts guests trust."
      lede="Hosts in Tulum add you to the page they send every guest. You set the commission, guests book you directly."
      heroPhoto={hero}
      heroAlt="Kayak on turquoise water"
      cta={{ label: "Create a vendor account", to: "/signup/vendor" }}
      rows={[
        { title: "Show up where trips get planned", body: "Guests open their host's page before they arrive, when they are still choosing what to do.", photo: horseback, alt: "Horseback ride along the beach" },
        { title: "Your reviews come with you", body: "Connect your Google listing and your existing rating appears on your profile automatically.", photo: yoga, alt: "Yoga class on a wooden deck" },
        { title: "You set the terms", body: "Pick the commission you offer hosts and the prices guests pay. Change them any time.", photo: scuba, alt: "Diver in a cenote" },
      ]}
      steps={[
        { title: "Create your profile", body: "Add photos, prices and your Google listing." },
        { title: "Set your commission", body: "Choose what you offer hosts for each booking." },
        { title: "Get added by hosts", body: "Hosts browse vendors and add you to their storefronts." },
        { title: "Take bookings", body: "Guests book you directly and you see each one in your dashboard." },
      ]}
      closing={{ title: "Bring your business to the hosts' front page.", body: "Hosts earn the commission you choose, only on bookings they send you." }}
    />
  );
}
