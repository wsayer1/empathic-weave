import { useState, useEffect } from "react";

const hotTakes = [
  "Remote work is the best thing that happened to work-life balance",
  "AI will create more jobs than it destroys",
  "Gen Z is more socially conscious than any generation before",
  "Social media connects us with people we'd never meet otherwise",
  "People are more aware of mental health than ever",
  "The dating apps actually work if you use them right",
  "Subscription services give us access to everything for cheap",
  "Everyone caring about the environment is actually changing things",
  "Crypto is democratizing finance for everyone",
  "Nobody reads books anymore, just headlines",
  "Most influencers are just regular people sharing their passion"
];

export const TypingPlaceholder = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const currentTake = hotTakes[currentIndex];
    let timeoutId: NodeJS.Timeout;

    if (isTyping) {
      if (displayText.length < currentTake.length) {
        timeoutId = setTimeout(() => {
          setDisplayText(currentTake.slice(0, displayText.length + 1));
        }, 50 + Math.random() * 50); // Variable typing speed
      } else {
        // Finished typing, wait then start fading
        timeoutId = setTimeout(() => {
          setIsTyping(false);
        }, 1500);
      }
    } else {
      // Fade out and move to next
      timeoutId = setTimeout(() => {
        setDisplayText("");
        setCurrentIndex((prev) => (prev + 1) % hotTakes.length);
        setIsTyping(true);
      }, 800);
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, isTyping, currentIndex]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className={`transition-opacity duration-500 ${isTyping ? 'opacity-100' : 'opacity-30'}`}>
      {displayText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}>|</span>
    </span>
  );
};