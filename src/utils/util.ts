// Capitalize the first letter of each word
export const capitalizeWords = (str: string): string =>
  str.replace(/\b\w/g, char => char.toUpperCase());

export const formatDoctorName = (firstName: string, lastName?: string): string => {
  if (!firstName) return '';
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  let nameWithTitle = fullName;
  // Check if "Dr." is already present at the beginning (case insensitive)
  if (!/^dr\.?\s+/i.test(fullName)) {
    nameWithTitle = `Dr. ${fullName}`;
  }
  return capitalizeWords(nameWithTitle);
};

// Optional: You can also create a function to get just the full name without title
export const getFullName = (firstName: string, lastName?: string): string => {
  return `${firstName || ''} ${lastName || ''}`.trim();
};

// Get avatar initials from first and last name
export const getAvatarInitial = (firstName?: string, lastName?: string): string => {
  const firstInitial = firstName?.[0] || 'D';
  const lastInitial = lastName?.[0] || '';
  return (firstInitial + lastInitial).toUpperCase();
};

// Format appointment time to 12-hour format with AM/PM
export const formatAppointmentTime = (timeString?: string): string => {
  if (!timeString) return '';
  
  try {
    const tstr = timeString.trim();
    
    // If already contains AM/PM, just uppercase it
    if (/am|pm/i.test(tstr)) {
      return tstr.replace(/am/gi, 'AM').replace(/pm/gi, 'PM');
    }
    
    // Try to parse as 24-hour time (HH:mm or HH:mm:ss)
    const timeMatch = tstr.match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      
      if (hours >= 0 && hours <= 23) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours.toString().padStart(2, '0')}:${minutes} ${period}`;
      }
    }
    
    // Try parsing as Date object
    const parsed = new Date(`1970-01-01T${tstr}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    // If all else fails, return original string
    return tstr;
  } catch (error) {
    return timeString;
  }
};