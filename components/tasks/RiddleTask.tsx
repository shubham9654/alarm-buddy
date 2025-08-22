import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Difficulty = 'easy' | 'medium' | 'hard';

type Riddle = {
  question: string;
  answer: string;
  hint?: string;
  options?: string[];
};

type TaskResult = {
  completed: boolean;
  answer?: string;
};

interface RiddleTaskProps {
  difficulty: Difficulty;
  onComplete: (result: TaskResult) => void;
  isDark: boolean;
}

export function RiddleTask({ difficulty, onComplete, isDark }: RiddleTaskProps) {
  const [riddle, setRiddle] = useState<Riddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    generateRiddle();
  }, [difficulty]);

  const generateRiddle = () => {
    const riddles = getRiddlesByDifficulty(difficulty);
    const selectedRiddle = riddles[Math.floor(Math.random() * riddles.length)];
    
    if (!selectedRiddle) {
      return;
    }
    
    const useMultipleChoice = Math.random() > 0.6;
    
    if (useMultipleChoice) {
      selectedRiddle.options = generateOptions(selectedRiddle.answer);
      setIsMultipleChoice(true);
    } else {
      setIsMultipleChoice(false);
    }

    setRiddle(selectedRiddle);
    setUserAnswer('');
    setSelectedOption(null);
    setAttempts(0);
    setShowHint(false);
  };

  const getRiddlesByDifficulty = (difficulty: Difficulty): Riddle[] => {
    switch (difficulty) {
      case 'easy':
        return [
          {
            question: "What has keys but no locks, space but no room, and you can enter but not go inside?",
            answer: "keyboard",
            hint: "You're probably using one right now to type."
          },
          {
            question: "What gets wet while drying?",
            answer: "towel",
            hint: "You use it after a shower."
          },
          {
            question: "What has hands but cannot clap?",
            answer: "clock",
            hint: "It tells you the time."
          },
          {
            question: "What has a head and a tail but no body?",
            answer: "coin",
            hint: "You flip it to make decisions."
          },
          {
            question: "What can you catch but not throw?",
            answer: "cold",
            hint: "It makes you sneeze and cough."
          },
          {
            question: "What has one eye but cannot see?",
            answer: "needle",
            hint: "Used for sewing."
          },
          {
            question: "What goes up but never comes down?",
            answer: "age",
            hint: "It increases every year on your birthday."
          },
          {
            question: "What has teeth but cannot bite?",
            answer: "comb",
            hint: "You use it to fix your hair."
          }
        ];
      
      case 'medium':
        return [
          {
            question: "I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?",
            answer: "fire",
            hint: "It's hot and bright."
          },
          {
            question: "The more you take, the more you leave behind. What am I?",
            answer: "footsteps",
            hint: "You make them when you walk."
          },
          {
            question: "What can travel around the world while staying in a corner?",
            answer: "stamp",
            hint: "You put it on letters."
          },
          {
            question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
            answer: "map",
            hint: "It helps you navigate."
          },
          {
            question: "What breaks but never falls, and what falls but never breaks?",
            answer: "day and night",
            hint: "One happens when the sun rises, the other when it sets."
          },
          {
            question: "I'm tall when I'm young and short when I'm old. What am I?",
            answer: "candle",
            hint: "It gives light and melts."
          },
          {
            question: "What has a bottom at the top?",
            answer: "leg",
            hint: "Part of your body."
          },
          {
            question: "What gets sharper the more you use it?",
            answer: "brain",
            hint: "The more you think, the better it gets."
          }
        ];
      
      case 'hard':
        return [
          {
            question: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
            answer: "echo",
            hint: "You hear it in mountains and empty rooms."
          },
          {
            question: "The person who makes it, sells it. The person who buys it, never uses it. The person who uses it, never knows they're using it. What is it?",
            answer: "coffin",
            hint: "It's used in funerals."
          },
          {
            question: "I have keys but no locks. I have space but no room. You can enter, but you can't go outside. What am I?",
            answer: "keyboard",
            hint: "You're probably looking at one right now."
          },
          {
            question: "What disappears as soon as you say its name?",
            answer: "silence",
            hint: "It's the absence of sound."
          },
          {
            question: "I am always hungry and will die if not fed, but whatever I touch will soon turn red. What am I?",
            answer: "fire",
            hint: "It consumes everything in its path."
          },
          {
            question: "What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?",
            answer: "river",
            hint: "It flows from mountains to the sea."
          },
          {
            question: "I am taken from a mine and shut up in a wooden case, from which I am never released, and yet I am used by almost everyone. What am I?",
            answer: "pencil lead",
            hint: "You use it to write."
          },
          {
            question: "What has four wheels and flies?",
            answer: "garbage truck",
            hint: "It collects waste and attracts insects."
          }
        ];
      
      default:
        return getRiddlesByDifficulty('medium');
    }
  };

  const generateOptions = (correctAnswer: string): string[] => {
    const allRiddles = [
      ...getRiddlesByDifficulty('easy'),
      ...getRiddlesByDifficulty('medium'),
      ...getRiddlesByDifficulty('hard')
    ];
    
    const options = [correctAnswer];
    const otherAnswers = allRiddles
      .map(r => r.answer)
      .filter(answer => answer !== correctAnswer);
    
    while (options.length < 4 && otherAnswers.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherAnswers.length);
      const option = otherAnswers.splice(randomIndex, 1)[0];
      if (option) {
        options.push(option);
      }
    }
    
    // If we don't have enough options, add some generic ones
    const genericOptions = ['water', 'air', 'light', 'shadow', 'mirror', 'door', 'window', 'book'];
    while (options.length < 4) {
      const option = genericOptions[Math.floor(Math.random() * genericOptions.length)];
      if (option && !options.includes(option)) {
        options.push(option);
      }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  };

  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);
    
    // Check exact match
    if (normalizedUser === normalizedCorrect) {
      return true;
    }
    
    // Check if user answer contains the correct answer or vice versa
    if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) {
      return true;
    }
    
    // Check for common variations
    const variations: { [key: string]: string[] } = {
      'day and night': ['dayandnight', 'day night', 'daynight'],
      'pencil lead': ['pencillead', 'pencil', 'lead'],
      'garbage truck': ['garbagetruck', 'trash truck', 'trashtruck'],
    };
    
    for (const [correct, vars] of Object.entries(variations)) {
      if (normalizedCorrect === normalizeAnswer(correct)) {
        return vars.some(variation => normalizedUser === variation);
      }
    }
    
    return false;
  };

  const handleSubmit = () => {
    if (!riddle) return;
    
    const answer = isMultipleChoice ? selectedOption : userAnswer;
    if (!answer) return;
    
    const isCorrect = isAnswerCorrect(answer, riddle.answer);
    
    if (isCorrect) {
      onComplete({ completed: true, answer });
    } else {
      setAttempts(prev => prev + 1);
      
      if (attempts >= 1 && riddle.hint) {
        setShowHint(true);
      }
      
      onComplete({ completed: false, answer });
    }
  };

  if (!riddle) {
    return (
      <View className="justify-center items-center p-4">
        <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
          Loading riddle...
        </Text>
      </View>
    );
  }

  return (
    <View className="w-full">
      {/* Riddle */}
      <View className={`${isDark ? 'bg-purple-900' : 'bg-purple-50'} rounded-lg p-4 mb-4`}>
        <Text className={`text-center text-lg font-medium mb-3 ${isDark ? 'text-purple-200' : 'text-purple-900'} leading-6`}>
          {riddle.question}
        </Text>
        <Text className={`text-center text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Riddle
        </Text>
      </View>

      {/* Hint */}
      {showHint && riddle.hint && (
        <View className={`${isDark ? 'bg-yellow-900' : 'bg-yellow-50'} rounded-lg p-3 mb-4`}>
          <View className="flex-row items-start">
            <Ionicons name="bulb" size={16} color={isDark ? '#FCD34D' : '#D97706'} className="mt-1" />
            <Text className={`ml-2 text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'} flex-1`}>
              Hint: {riddle.hint}
            </Text>
          </View>
        </View>
      )}

      {/* Answer Input */}
      {isMultipleChoice ? (
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Select the correct answer:
          </Text>
          <View className="space-y-2">
            {riddle.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedOption(option)}
                className={`p-3 rounded-lg border-2 ${
                  selectedOption === option
                    ? (isDark ? 'bg-purple-700 border-purple-500' : 'bg-purple-100 border-purple-500')
                    : (isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                }`}
              >
                <Text className={`text-center font-medium ${
                  selectedOption === option
                    ? (isDark ? 'text-white' : 'text-purple-900')
                    : (isDark ? 'text-gray-300' : 'text-gray-700')
                }`}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Enter your answer:
          </Text>
          <TextInput
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="Your answer"
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-4 py-3 text-lg`}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {/* Attempts Counter */}
      {attempts > 0 && (
        <View className="mb-4">
          <Text className={`text-center text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Incorrect attempts: {attempts}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row space-x-3">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isMultipleChoice ? selectedOption === null : !userAnswer.trim()}
          className={`flex-1 py-3 rounded-lg ${
            (isMultipleChoice ? selectedOption !== null : userAnswer.trim())
              ? (isDark ? 'bg-green-700' : 'bg-green-600')
              : (isDark ? 'bg-gray-700' : 'bg-gray-400')
          }`}
        >
          <Text className="text-white font-semibold text-center">
            Submit Answer
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={generateRiddle}
          className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-500'}`}
        >
          <Ionicons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}