import { format, isToday, isTomorrow } from 'date-fns';

export const getFormattedDate = (date: Date) => {
  const formattedDate = format(date, 'M/d/yyyy');

  let expiration: string;
  if (isToday(date)) {
    expiration = `Today ${formattedDate}`;
  } else if (isTomorrow(date)) {
    expiration = `Tomorrow ${formattedDate}`;
  } else {
    expiration = formattedDate;
  }

  return expiration;
};

export const normalizeItem = (title: string) =>
  title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export const getFileName = (path: string) => {
  const parts = path.split('\\');
  return parts[parts.length - 1];
};
