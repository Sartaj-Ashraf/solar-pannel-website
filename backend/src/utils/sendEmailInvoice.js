import SendEmail from "./SendEmail.js";
const sendInvoiceEmail = async ({ name, email, booking }) => {
    // Construct a professional HTML invoice template
    const invoiceHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
        <h2 style="color: #333;">Booking Invoice</h2>
        <p style="font-size: 16px; color: #555;">
          Hello <strong>${name}</strong>,
        </p>
        <p style="font-size: 16px; color: #555;">
          Thank you for your booking. Below are your invoice details:
        </p>
  
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #0070f3; color: #fff;">
              <th style="padding: 8px; border: 1px solid #ddd;">Description</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Guest Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.guestDetails.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Booking ID</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Check-in</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date(booking.checkIn).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Check-out</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date(booking.checkOut).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Nights</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.numberOfNights}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Rooms Booked</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.roomsBooked.length}</td>
            </tr>
            <tr style="font-weight: bold; background: #f9fafb;">
              <td style="padding: 8px; border: 1px solid #ddd;">Total Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: #0070f3;">₹${booking.finalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
  
        <p style="font-size: 14px; color: #555;">
          If you have any questions, feel free to contact our support team.
        </p>
  
        <p style="font-size: 12px; color: #999; margin-top: 40px;">
          &copy; ${new Date().getFullYear()} Hotel Devillaz. All rights reserved.
        </p>
      </div>
    `;
  
    return SendEmail({
      to: email,
      subject: `Invoice for your booking (${booking.bookingId})`,
      html: invoiceHtml,
    });
  };

  export default sendInvoiceEmail;
  