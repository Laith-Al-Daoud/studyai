/**
 * Flashcard Component
 * 
 * Individual flashcard that toggles between question and answer
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface FlashcardProps {
  question: string;
  answer: string;
}

export function Flashcard({ question, answer }: FlashcardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleClick = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      <Card
        onClick={handleClick}
        className="w-full h-full min-h-[300px] p-8 cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center"
      >
        <div className="mb-4">
          <span className="text-sm font-semibold text-accent uppercase tracking-wide">
            {showAnswer ? 'Answer' : 'Question'}
          </span>
        </div>
        <motion.div
          key={showAnswer ? 'answer' : 'question'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex items-center justify-center"
        >
          <p className="text-lg md:text-xl text-text-primary leading-relaxed">
            {showAnswer ? answer : question}
          </p>
        </motion.div>
        <div className="mt-6 text-sm text-text-secondary">
          Click to {showAnswer ? 'see question' : 'reveal answer'}
        </div>
      </Card>
    </motion.div>
  );
}

