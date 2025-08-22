import pkg from 'google-libphonenumber';
const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
/**
 * Extracts a potential phone number from a given text.
 * This function tries to find a sequence of digits that could be a phone number.
 * It's a simplified extraction and might need more sophisticated logic for production use.
 * @param text The text to search for a phone number.
 * @returns A string containing the extracted phone number, or null if not found.
 */
export function extractPhoneNumber(text) {
    // This regex looks for a sequence of 9 or more digits.
    // It's a simple approach and might capture non-phone numbers.
    const phoneRegex = /\d{9,}/g;
    const matches = text.match(phoneRegex);
    if (matches && matches.length > 0) {
        // For simplicity, return the first match.
        // A more complex implementation could validate the number further.
        return matches[0];
    }
    return null;
}
