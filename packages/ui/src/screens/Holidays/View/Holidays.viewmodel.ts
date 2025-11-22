import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateHoliday,
  useDeleteHoliday,
  useGetAllHolidays,
  useUpdateHoliday,
} from "../../../services/tags/useHolidays";

interface HolidaysData {
  isEditModalOpen: boolean;
  selectedHoliday: Tag | null;
  holidays: Tag[];
}
interface HolidaysActions {
  addHoliday: () => void;
  onEdit: (item: Tag) => void;
  onSave: (item: Tag) => void;
  onSaveNew: (item: Tag) => void;
  onRemove: (item: Tag) => void;
}

export interface HolidaysViewModel extends HolidaysData, HolidaysActions {}

const useHolidaysViewModel = (
  navigate: ReturnType<typeof useRootStack>
): HolidaysViewModel => {
  const $getHolidays = useGetAllHolidays();
  const $createHoliday = useCreateHoliday();
  const $deleteHoliday = useDeleteHoliday();
  const $updateHoliday = useUpdateHoliday();

  const [isEditModalOpen, setEditModalState] = useState(false);
  const [savedHolidays, setSavedHolidays] = useState<Tag[]>([]);
  const [newHoliday, setNewHoliday] = useState<Tag | null>(null);
  const [holidays, setHolidays] = useState<Tag[]>([]);
  const [selectedHoliday, setSelectedHoliday] = useState<Tag | null>(null);

  useEffect(() => {
    if ($getHolidays.data) {
      setSavedHolidays($getHolidays.data);
    }
  }, [$getHolidays.data]);

  useEffect(() => {
    let currentHolidays: Tag[] = [];
    currentHolidays = newHoliday
      ? [newHoliday, ...savedHolidays]
      : [...savedHolidays];
    setHolidays(currentHolidays);
  }, [newHoliday, savedHolidays]);

  const onEdit = (holiday: Tag) => {
    if (isEditModalOpen) {
      setSelectedHoliday(null);
      setEditModalState(false);
      return;
    }

    const holidayToEdit = holidays.find((m) => m.tagId === holiday.tagId);
    if (!holidayToEdit) {
      console.error("Holiday not found:", holiday);
      return;
    }

    const deepCopiedHoliday = JSON.parse(JSON.stringify(holidayToEdit));
    setSelectedHoliday(deepCopiedHoliday);
    setEditModalState(true);
  };

  const onSaveNew = (item: Tag) => {
    $createHoliday.mutate(item);
    setNewHoliday(null);
    setEditModalState(false);
  };

  const onSave = (item: Tag) => {
    const deepCopiedSelectedHoliday = JSON.parse(JSON.stringify(item));
    const existingHoliday = holidays.find(
      (c) => c.tagId === deepCopiedSelectedHoliday.tagId
    );
    if (existingHoliday) {
      $updateHoliday.mutate(deepCopiedSelectedHoliday);
      setSelectedHoliday(null);
      setNewHoliday(null);
      setEditModalState(false);
      return;
    }
    $createHoliday.mutate(deepCopiedSelectedHoliday);
    setSelectedHoliday(null);
    setNewHoliday(null);
    setEditModalState(false);
  };

  const onRemove = (item: Tag) => {
    if (item.tagId === newHoliday?.tagId) {
      setNewHoliday(null);
      return;
    } else {
      $deleteHoliday.mutate(item);
    }
  };

  const addHoliday = () => {
    if (newHoliday) {
      return;
    }
    const tempHoliday: Tag = {
      tagId: uuidv4(),
      name: "",
    };
    setNewHoliday(tempHoliday);
  };

  return {
    selectedHoliday,
    isEditModalOpen,
    holidays,
    addHoliday,
    onEdit,
    onSave,
    onSaveNew,
    onRemove,
  };
};

export default useHolidaysViewModel;
