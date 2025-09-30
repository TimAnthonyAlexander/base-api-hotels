<?php

namespace App\Controllers;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\Offer;
use App\Models\Search;
use App\Models\User;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

/**
 * BookingController
 * 
 * Handles booking creation and retrieval
 */
class BookingController extends Controller
{
    public string $booking_id = '';

    public string $search_id = '';

    public string $hotel_id = '';

    public string $room_id = '';

    public string $offer_id = '';

    public function get(): JsonResponse
    {
        $booking = Booking::find($this->booking_id);

        if (!$booking instanceof Booking) {
            return JsonResponse::error('Booking not found', 404);
        }

        // Verify the booking belongs to the authenticated user
        if ($booking->user_id !== ($this->request->user['id'] ?? '')) {
            return JsonResponse::error('Unauthorized', 403);
        }

        // Load related data
        $hotel = Hotel::find($booking->hotel_id);
        $room = Room::find($booking->room_id);
        $offer = Offer::find($booking->offer_id);
        $search = Search::find($booking->search_id);

        return JsonResponse::ok([
            'booking' => $booking,
            'hotel' => $hotel,
            'room' => $room,
            'offer' => $offer,
            'search' => $search,
        ]);
    }

    public function post(): JsonResponse
    {
        $this->validate([
            'search_id' => 'required|string',
            'hotel_id' => 'required|string',
            'room_id' => 'required|string',
            'offer_id' => 'required|string',
        ]);

        $user = User::find($this->request->user['id'] ?? '');

        if (!$user instanceof User) {
            return JsonResponse::error('User not found', 404);
        }

        // Verify search exists and belongs to user
        $search = Search::find($this->search_id);
        if (!$search instanceof Search) {
            return JsonResponse::error('Search not found', 404);
        }

        // Verify hotel exists
        $hotel = Hotel::find($this->hotel_id);
        if (!$hotel instanceof Hotel) {
            return JsonResponse::error('Hotel not found', 404);
        }

        // Verify room exists and belongs to hotel
        $room = Room::find($this->room_id);
        if (!$room instanceof Room || $room->hotel_id !== $hotel->id) {
            return JsonResponse::error('Room not found', 404);
        }

        // Verify offer exists and belongs to room
        $offer = Offer::find($this->offer_id);
        if (!$offer instanceof Offer || $offer->room_id !== $room->id) {
            return JsonResponse::error('Offer not found', 404);
        }

        // Verify offer is available
        if (!$offer->availability) {
            return JsonResponse::error('Offer is no longer available', 400);
        }

        // Create booking
        $booking = new Booking();
        $booking->user_id = $user->id;
        $booking->search_id = $search->id;
        $booking->hotel_id = $hotel->id;
        $booking->room_id = $room->id;
        $booking->offer_id = $offer->id;
        $booking->starts_on = $search->starts_on;
        $booking->ends_on = $search->ends_on;
        $booking->capacity = $search->capacity;
        $booking->total_price = $offer->effective_price;
        $booking->status = 'confirmed';

        $booking->save();

        return JsonResponse::created([
            'booking_id' => $booking->id,
            'booking' => $booking,
        ]);
    }
}

