import { useState, useEffect } from "react";

const hotTakes = [
  "The dating scene in SF is fucked",
  "Remote work killed office culture forever",
  "Social media destroyed genuine friendships",
  "AI will replace most jobs within 5 years",
  "Gen Z has no attention span anymore",
  "Everyone pretends to care about the environment",
  "Subscription services are the new poverty trap",
  "Nobody reads books anymore, just headlines",
  "Crypto was always just gambling with extra steps",
  "Everyone's mental health excuse is just being lazy",
  "Influencers contribute nothing to society"
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