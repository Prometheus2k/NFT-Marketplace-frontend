import React from "react";

// INTERNAL IMPORTS
import Style from "../styles/index.module.css";
import { HeroSection } from "../components/componentsindex";

const Home = () => {
  return (
    <div className={Style.homePage}>
      <HeroSection />
    </div>
  );
};

export default Home;
