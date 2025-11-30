import { Routes, Route } from 'react-router-dom';
import {
  Aesthetics,
  AgeGroups,
  Blocks,
  Bumpers,
  Cascade,
  Collections,
  Commercials,
  Eras,
  Genres,
  Help,
  Holidays,
  Home,
  Mosaic,
  Movies,
  Music,
  MusicGenres,
  Promos,
  Settings,
  Shorts,
  Shows,
  Specialties,
  Splash,
} from '../screens';
import MainLayout from '../layouts/Main/MainLayout';

function RootStackNavigator() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route element={<MainLayout />}>
        <Route path="/aesthetics" element={<Aesthetics />} />
        <Route path="/age-groups" element={<AgeGroups />} />
        <Route path="/blocks" element={<Blocks />} />
        <Route path="/bumpers" element={<Bumpers />} />
        <Route path="/cascade" element={<Cascade />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/commercials" element={<Commercials />} />
        <Route path="/eras" element={<Eras />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/help" element={<Help />} />
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/home" element={<Home />} />
        <Route path="/mosaic" element={<Mosaic />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/music" element={<Music />} />
        <Route path="/music-genres" element={<MusicGenres />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/shorts" element={<Shorts />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/specialties" element={<Specialties />} />
      </Route>
    </Routes>
  );
}

export default RootStackNavigator;
