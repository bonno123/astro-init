export default function useNotification() {
    // Function to show a notification
    const notify = ({ 
        type, 
        message 
    }: { 
        type: 'success' | 'error',
         message: string 
    }) => {

    const notification = document.createElement('div');

    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Trigger the show class to start the transition
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
  
    // Append the notification to the body
    document.body.appendChild(notification);
  
    // Automatically remove the notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 500); // Wait for the transition to complete before removing
      }, 3000);
    };
  
    return {
      notify,
    };
}