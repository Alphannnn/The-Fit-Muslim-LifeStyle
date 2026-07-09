import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Pillars from "@/components/Pillars";
import FeaturedProducts from "@/components/FeaturedProducts";
import DietPlanFlow from "@/components/DietPlanFlow";
import Journal from "@/components/Journal";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Pillars />
      <FeaturedProducts />
      <DietPlanFlow />
      <Journal />
      <Footer />
    </main>
  );
}
