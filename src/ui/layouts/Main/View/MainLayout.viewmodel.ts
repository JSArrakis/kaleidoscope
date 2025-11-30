import { useState } from "react";
import useRootStack from "../../../navigation/useRootStack";

interface MainLayoutData {
  isModalOpen: boolean;
  expandedAccordion: string | null;
}

interface MainLayoutActions {
  closeModal: () => void;
  toggleAccordion: (accordion: string) => void;
  navigateTo: (destination: string) => void;
}

export interface MainLayoutViewModel
  extends MainLayoutData,
    MainLayoutActions {}

const useMainLayoutViewModel = (): MainLayoutViewModel => {
  const navigate = useRootStack();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    null
  );

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleAccordion = (accordion: string) => {
    if (expandedAccordion === accordion) {
      setExpandedAccordion(null);
    } else {
      setExpandedAccordion(null);
      setTimeout(() => {
        setExpandedAccordion(accordion);
      }, 300);
    }
  };

  const navigateTo = (destination: string) => {
    switch (destination) {
      case "aesthetics":
        navigate("/aesthetics");
        break;
      case "age-groups":
        navigate("/age-groups");
        break;
      case "blocks":
        navigate("/blocks");
        break;
      case "bumpers":
        navigate("/bumpers");
        break;
      case "cascade":
        navigate("/cascade");
        break;
      case "collections":
        navigate("/collections");
        break;
      case "commercials":
        navigate("/commercials");
        break;
      case "eras":
        navigate("/eras");
        break;
      case "genres":
        navigate("/genres");
        break;
      case "help":
        toggleAccordion("help");
        navigate("/help");
        break;
      case "home":
        navigate("/home");
        break;
      case "holidays":
        navigate("/holidays");
        break;
      case "mosaic":
        navigate("/mosaic");
        break;
      case "movies":
        navigate("/movies");
        break;
      case "music":
        navigate("/music");
        break;
      case "music-genres":
        navigate("/music-genres");
        break;
      case "promos":
        navigate("/promos");
        break;
      case "settings":
        toggleAccordion("settings");
        navigate("/settings");
        break;
      case "shorts":
        navigate("/shorts");
        break;
      case "shows":
        navigate("/shows");
        break;
      case "specialties":
        navigate("/specialties");
        break;
      default:
        console.warn(`Unknown destination: ${destination}`);
    }
  };

  return {
    isModalOpen,
    closeModal,
    expandedAccordion,
    toggleAccordion,
    navigateTo,
  };
};

export default useMainLayoutViewModel;
