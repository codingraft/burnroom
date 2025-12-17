import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const ANIMALS = [
  "cat",
  "dog",
  "fox",
  "lion",
  "tiger",
  "bear",
  "wolf",
  "eagle",
  "shark",
  "whale",
];
const STORAGE_KEY = "chat_username";

const generateUsername = () => {
  const word = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

  return `anonymous-${word}-${nanoid(5)}`;
};

export const useUsername = () => {
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const main = () => {
      const storedUsername = localStorage.getItem(STORAGE_KEY);
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        const newUsername = generateUsername();
        localStorage.setItem(STORAGE_KEY, newUsername);
        setUsername(newUsername);
      }
    };
    main();
  }, []);

  return {username};
};
