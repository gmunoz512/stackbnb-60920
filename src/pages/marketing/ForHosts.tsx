import { PartnerPage } from "@/components/marketing/PartnerPage";
import hero from "@/assets/experiences/snorkeling-2.jpg";
import cooking from "@/assets/experiences/cooking.jpg";
import dining from "@/assets/experiences/dining.jpg";
import bikes from "@/assets/experiences/bikes.jpg";

export default function ForHosts() {
  return (
    <PartnerPage
      audience="For Airbnb hosts in Tulum"
      title="Your guests already ask you where to go."
      lede="Put the guides, cenote trips and tables you trust on one page, share it with every booking, and earn a commission when guests book through it."
      heroPhoto={hero}
      heroAlt="Swimmer in clear cenote water"
      cta={{ label: "Create a host account", to: "/signup/host" }}
      rows={[
        { title: "A storefront that sounds like you", body: "Pick the places you send friends to. Guests see your picks first, with real Google ratings beside each one.", photo: dining, alt: "Dinner table under string lights" },
        { title: "Commission on every booking", body: "Vendors set the rate up front. Your dashboard shows each booking and what you earned from it.", photo: cooking, alt: "Hands making tortillas at a cooking class" },
        { title: "Fewer messages at check-in", body: "Instead of retyping the same recommendations, send one link that stays current.", photo: bikes, alt: "Bicycles parked on a jungle road" },
      ]}
      steps={[
        { title: "Create your account", body: "Add your property and a short intro for guests." },
        { title: "Choose your vendors", body: "Browse local guides and restaurants and add the ones you vouch for." },
        { title: "Share your link", body: "Send your storefront in your welcome message or house manual." },
      ]}
      closing={{ title: "Start with the places you already recommend.", body: "Setup takes a few minutes. You can change your picks whenever you like." }}
    />
  );
}
