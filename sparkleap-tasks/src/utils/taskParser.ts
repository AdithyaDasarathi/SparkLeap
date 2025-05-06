import { parse } from 'chrono-node';
import { categories, TaskCategory, Priority } from '@/types/task';

export function parseTaskInput(input: string) {
  // Parse date and time from the input
  const dates = parse(input, undefined, { forwardDate: true });
  const dueDate = dates.length > 0 ? dates[0].start.date() : null;
  
  // Extract time if present in the parsed date
  let dueTime = null;
  if (dates.length > 0 && dates[0].start.isCertain('hour')) {
    const hours = dates[0].start.get('hour');
    if (hours !== null) {
      const minutes = dates[0].start.get('minute') || 0;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      dueTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }

  // Define keywords to remove
  const lowPriorityKeywords = ['low priority', 'low-priority', 'not urgent', 'can wait', 'whenever possible'];
  const highPriorityKeywords = ['high priority', 'high-priority', 'urgent', 'asap', 'important', 'critical'];
  const allPriorityKeywords = [...lowPriorityKeywords, ...highPriorityKeywords];

  // Define transition words and prepositions to remove
  const timeTransitionWords = [
    'by', 'until', 'before', 'due', 'on', 'at', 'for',
    'due by', 'due on', 'due at', 'needed by', 'needed at',
    'to be done by', 'to be completed by', 'finish by', 'complete by',
    'scheduled for', 'set for', 'planned for'
  ];

  // Try to detect priority
  let priority: Priority = 'Medium'; // Default priority
  const inputLower = input.toLowerCase();
  if (lowPriorityKeywords.some(keyword => inputLower.includes(keyword))) {
    priority = 'Low';
  } else if (highPriorityKeywords.some(keyword => inputLower.includes(keyword))) {
    priority = 'High';
  }

  // Try to detect category
  let category: TaskCategory = 'General';
  for (const cat of categories) {
    if (inputLower.includes(cat.toLowerCase())) {
      category = cat;
      break;
    }
  }

  // Clean up the title by removing date/time, priority keywords, and parenthetical expressions
  let title = input;

  // Remove the date/time part and any following transition words
  if (dates.length > 0 && dates[0].text) {
    // First, try to find and remove any transition words that come before the date
    const dateText = dates[0].text;
    const dateIndex = title.toLowerCase().indexOf(dateText.toLowerCase());
    if (dateIndex > 0) {
      // Look for transition words before the date
      const textBeforeDate = title.slice(0, dateIndex);
      timeTransitionWords.forEach(word => {
        const pattern = new RegExp(`\\s*${word}\\s+$`, 'i');
        if (pattern.test(textBeforeDate)) {
          title = title.slice(0, dateIndex).replace(pattern, '') + title.slice(dateIndex + dateText.length);
          return;
        }
      });
    }
    // If no transition words were found before, just remove the date text
    title = title.replace(dateText, '');
  }

  // Remove priority keywords and their associated transition words
  allPriorityKeywords.forEach(keyword => {
    // Remove the keyword with or without parentheses
    title = title.replace(new RegExp(`\\s*\\(${keyword}\\)\\s*`, 'gi'), ' ');
    title = title.replace(new RegExp(`\\s*${keyword}\\s*`, 'gi'), ' ');
  });

  // Remove any remaining transition words at the end of the title
  timeTransitionWords.forEach(word => {
    title = title.replace(new RegExp(`\\s*${word}\\s*$`, 'gi'), ' ');
  });

  // Remove empty parentheses and clean up spaces
  title = title
    .replace(/\s*\(\s*\)\\s*/g, ' ') // Remove empty parentheses
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*,\s*$/, '') // Remove trailing commas
    .trim();

  return {
    title,
    dueDate,
    dueTime,
    category,
    priority,
  };
}
