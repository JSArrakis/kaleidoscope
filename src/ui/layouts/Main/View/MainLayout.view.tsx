import { FC } from "react";
import { Outlet } from "react-router-dom";
import { MainLayoutViewModel } from "./MainLayout.viewmodel";
import styles from "./MainLayout.module.css";
import { Button, Modal } from "../../../components";

interface MainLayoutViewProps {
  viewModel: MainLayoutViewModel;
}

const MainLayoutView: FC<MainLayoutViewProps> = function MainLayoutView({
  viewModel,
}) {
  const { isModalOpen, expandedAccordion } = viewModel;
  const { closeModal, toggleAccordion, navigateTo } = viewModel;

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div
            onClick={() => navigateTo("home")}
            role="button"
            tabIndex={0}
            className={styles.logoContainer}
          >
            Prism
          </div>
          <div className={styles.sidebarContent}>
            <Button
              onClick={() => toggleAccordion("media")}
              className={styles.mediaButton}
            >
              Media
            </Button>
            <div
              className={`${styles.subButtons} ${
                expandedAccordion === "media" ? styles.expanded : ""
              }`}
            >
              <Button
                onClick={() => navigateTo("movies")}
                className={styles.subButton}
              >
                Movies
              </Button>
              <Button
                onClick={() => navigateTo("shows")}
                className={styles.subButton}
              >
                Shows
              </Button>
              <Button
                onClick={() => navigateTo("shorts")}
                className={styles.subButton}
              >
                Shorts
              </Button>
              <Button
                onClick={() => navigateTo("music")}
                className={styles.subButton}
              >
                Music Videos
              </Button>
              <Button
                onClick={() => navigateTo("commercials")}
                className={styles.subButton}
              >
                Commercials
              </Button>
              <Button
                onClick={() => navigateTo("promos")}
                className={styles.subButton}
              >
                Promos
              </Button>
              <Button
                onClick={() => navigateTo("bumpers")}
                className={styles.subButton}
              >
                Bumpers
              </Button>
            </div>
            <Button
              onClick={() => toggleAccordion("tags")}
              className={styles.mediaButton}
            >
              Tags
            </Button>
            <div
              className={`${styles.subButtons} ${
                expandedAccordion === "tags" ? styles.expanded : ""
              }`}
            >
              <Button
                onClick={() => navigateTo("age-groups")}
                className={styles.subButton}
              >
                Age Groups
              </Button>
              <Button
                onClick={() => navigateTo("genres")}
                className={styles.subButton}
              >
                Genres
              </Button>
              <Button
                onClick={() => navigateTo("aesthetics")}
                className={styles.subButton}
              >
                Aesthetics
              </Button>
              <Button
                onClick={() => navigateTo("specialties")}
                className={styles.subButton}
              >
                Specialties
              </Button>
              <Button
                onClick={() => navigateTo("eras")}
                className={styles.subButton}
              >
                Eras
              </Button>
              <Button
                onClick={() => navigateTo("holidays")}
                className={styles.subButton}
              >
                Holidays
              </Button>
              <Button
                onClick={() => navigateTo("music-genres")}
                className={styles.subButton}
              >
                Music Genres
              </Button>
            </div>
            <Button
              onClick={() => toggleAccordion("prisms")}
              className={styles.mediaButton}
            >
              Prisms
            </Button>
            <div
              className={`${styles.subButtons} ${
                expandedAccordion === "prisms" ? styles.expanded : ""
              }`}
            >
              <Button
                onClick={() => navigateTo("cascade")}
                className={styles.subButton}
              >
                Cascade
              </Button>
              <Button
                onClick={() => navigateTo("mosaic")}
                className={styles.subButton}
              >
                Mosaic
              </Button>
            </div>
            <Button
              onClick={() => toggleAccordion("curation")}
              className={styles.mediaButton}
            >
              Curation
            </Button>
            <div
              className={`${styles.subButtons} ${
                expandedAccordion === "curation" ? styles.expanded : ""
              }`}
            >
              <Button
                onClick={() => navigateTo("blocks")}
                className={styles.subButton}
              >
                Blocks
              </Button>
              <Button
                onClick={() => navigateTo("collections")}
                className={styles.subButton}
              >
                Collections
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.sidebarBottom}>
          <Button
            onClick={() => navigateTo("settings")}
            className={styles.mediaButton}
          >
            Settings
          </Button>
          <Button
            onClick={() => navigateTo("help")}
            className={styles.mediaButton}
          >
            Help
          </Button>
          <p className={styles.versionText}>Version 0.1.0</p>
        </div>
      </div>
      <div className={styles.mainContent}>
        <Outlet />
      </div>
      <Modal
        isOpen={isModalOpen}
        fullScreen
        style={{ padding: "20px", width: "100%", maxWidth: "500px" }}
      >
        <div className={styles.guideModalTitle}>Welcome to Prism</div>
        <div className={styles.guideModalText}>
          If you are unfamiliar with Kaleidoscope and how Prism interacts with
          it, click here for a guided tour!
        </div>
        <div className={styles.buttonContainer}>
          <Button onClick={closeModal} className={styles.closeTutorialButton}>
            Close
          </Button>
          <Button
            onClick={() => console.log("Guided Tour")}
            className={styles.guidedTourButton}
          >
            Guided Tour
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MainLayoutView;
