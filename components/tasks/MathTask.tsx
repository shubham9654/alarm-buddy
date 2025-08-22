import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Difficulty = 'easy' | 'medium' | 'hard';

type MathProblem = {
  question: string;
  answer: number;
  options?: number[];
};

type TaskResult = {
  completed: boolean;
  answer?: number;
};

interface MathTaskProps {
  difficulty: Difficulty;
  onComplete: (result: TaskResult) => void;
  isDark: boolean;
}

export function MathTask({ difficulty, onComplete, isDark }: MathTaskProps) {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    generateProblem();
  }, [difficulty]);

  const generateProblem = () => {
    let newProblem: MathProblem;
    const useMultipleChoice = Math.random() > 0.5;
    
    switch (difficulty) {
      case 'easy':
        newProblem = generateEasyProblem();
        break;
      case 'medium':
        newProblem = generateMediumProblem();
        break;
      case 'hard':
        newProblem = generateHardProblem();
        break;
      default:
        newProblem = generateMediumProblem();
    }

    if (useMultipleChoice) {
      newProblem.options = generateOptions(newProblem.answer);
      setIsMultipleChoice(true);
    } else {
      setIsMultipleChoice(false);
    }

    setProblem(newProblem);
    setUserAnswer('');
    setSelectedOption(null);
    setAttempts(0);
    setShowHint(false);
  };

  const generateEasyProblem = (): MathProblem => {
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let a, b, answer, question;
    
    if (operation === '+') {
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      question = `${a} + ${b}`;
    } else {
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      question = `${a} - ${b}`;
    }
    
    return { question, answer };
  };

  const generateMediumProblem = (): MathProblem => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let a, b, answer, question;
    
    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 10;
        answer = a + b;
        question = `${a} + ${b}`;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 25;
        b = Math.floor(Math.random() * (a - 10)) + 1;
        answer = a - b;
        question = `${a} - ${b}`;
        break;
      case '*':
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        question = `${a} × ${b}`;
        break;
      default:
        a = 10;
        b = 5;
        answer = 15;
        question = '10 + 5';
    }
    
    return { question, answer };
  };

  const generateHardProblem = (): MathProblem => {
    const operations = ['+', '-', '*', '/', 'mixed'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let a, b, c, answer, question;
    
    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * 100) + 50;
        b = Math.floor(Math.random() * 100) + 50;
        answer = a + b;
        question = `${a} + ${b}`;
        break;
      case '-':
        a = Math.floor(Math.random() * 100) + 100;
        b = Math.floor(Math.random() * (a - 50)) + 1;
        answer = a - b;
        question = `${a} - ${b}`;
        break;
      case '*':
        a = Math.floor(Math.random() * 15) + 5;
        b = Math.floor(Math.random() * 15) + 5;
        answer = a * b;
        question = `${a} × ${b}`;
        break;
      case '/':
        // Generate division that results in whole numbers
        answer = Math.floor(Math.random() * 20) + 5;
        b = Math.floor(Math.random() * 8) + 2;
        a = answer * b;
        question = `${a} ÷ ${b}`;
        break;
      case 'mixed':
        // Two-step problems
        a = Math.floor(Math.random() * 10) + 5;
        b = Math.floor(Math.random() * 10) + 5;
        c = Math.floor(Math.random() * 5) + 2;
        answer = (a + b) * c;
        question = `(${a} + ${b}) × ${c}`;
        break;
      default:
        a = 15;
        b = 25;
        answer = 40;
        question = '15 + 25';
    }
    
    return { question, answer };
  };

  const generateOptions = (correctAnswer: number): number[] => {
    const options = [correctAnswer];
    const range = Math.max(10, Math.abs(correctAnswer * 0.3));
    
    while (options.length < 4) {
      const offset = Math.floor(Math.random() * range * 2) - range;
      const option = correctAnswer + offset;
      
      if (option !== correctAnswer && !options.includes(option) && option > 0) {
        options.push(option);
      }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  const handleSubmit = () => {
    if (!problem) return;
    
    const answer = isMultipleChoice ? selectedOption : parseInt(userAnswer);
    const isCorrect = answer === problem.answer;
    
    if (isCorrect) {
      onComplete({ completed: true, answer });
    } else {
      setAttempts(prev => prev + 1);
      
      if (attempts >= 1) {
        setShowHint(true);
      }
      
      const result: TaskResult = { completed: false };
      if (answer !== null) {
        result.answer = answer;
      }
      onComplete(result);
    }
  };

  const getHint = (): string => {
    if (!problem) return '';
    
    const answer = problem.answer;
    const digits = answer.toString().length;
    
    if (digits === 1) {
      return `The answer is a single digit number.`;
    } else if (digits === 2) {
      return `The answer is a two-digit number starting with ${answer.toString()[0]}.`;
    } else {
      return `The answer is a ${digits}-digit number.`;
    }
  };

  if (!problem) {
    return (
      <View className="justify-center items-center p-4">
        <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
          Loading problem...
        </Text>
      </View>
    );
  }

  return (
    <View className="w-full">
      {/* Problem */}
      <View className={`${isDark ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg p-4 mb-4`}>
        <Text className={`text-center text-2xl font-bold mb-2 ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
          {problem.question} = ?
        </Text>
        <Text className={`text-center text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Math Problem
        </Text>
      </View>

      {/* Hint */}
      {showHint && (
        <View className={`${isDark ? 'bg-yellow-900' : 'bg-yellow-50'} rounded-lg p-3 mb-4`}>
          <View className="flex-row items-center">
            <Ionicons name="bulb" size={16} color={isDark ? '#FCD34D' : '#D97706'} />
            <Text className={`ml-2 text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
              Hint: {getHint()}
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
          <View className="grid grid-cols-2 gap-2">
            {problem.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedOption(option)}
                className={`p-3 rounded-lg border-2 ${
                  selectedOption === option
                    ? (isDark ? 'bg-blue-700 border-blue-500' : 'bg-blue-100 border-blue-500')
                    : (isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                }`}
              >
                <Text className={`text-center font-medium ${
                  selectedOption === option
                    ? (isDark ? 'text-white' : 'text-blue-900')
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
            keyboardType="numeric"
            className={`${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg px-4 py-3 text-lg`}
            autoFocus
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
          onPress={generateProblem}
          className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-500'}`}
        >
          <Ionicons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}