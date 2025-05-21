export const getStatusBadgeColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'bg-green-700';
    case 'RUNNING':
      return 'bg-blue-700';
    case 'PENDING':
      return 'bg-yellow-700';
    case 'FAILED':
      return 'bg-red-700';
    default:
      return 'bg-gray-700';
  }
};