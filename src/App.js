import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider } from './context/AuthContext'; // Adjust the import path as needed
import UpdatedHome from './components/Home/UpdatedHome'
import SignUpFlow from './components/Signup/Signup'
import UserProfile from './components/UserProfile/UserProfile'
import LogoutThankYou from './components/Menu/LogoutThankYou'
import AddListing from './components/Listing/AddListing'
import PropertyDescriptionForm from './components/Listing/PropertyDescriptionForm'
import SearchResultsPage from './components/Home/SearchResultsPage';
import ListingDetailsPage from './components/Home/ListingDetailsPage'; 
import MessagesInbox from './components/UserProfile/MessagesInbox';
import Dashboard from './components/Listing/Dashboard';
import WantedRoomForm from './components/Listing/FlaWantedRoomForm';import CustomerSupport from './components/CustomerCare/CustomerSupport';
import AccommodationForm from './components/Listing/AccommodationForm'
import StaffRegister  from './components/UserProfile/StaffRegister';
import StaffLogin  from './components/UserProfile/StaffLogin';
import StaffDashboard  from './components/UserProfile/StaffDashboard';

function App() {
  return (<AuthProvider>
      <Routes>
        <Route path="/" element={<UpdatedHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<SignUpFlow />} />
        <Route path="/signup" element={<SignUpFlow />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/listings" element={<AddListing />} />
        <Route path="/logout-thank-you" element={<LogoutThankYou />} />
        <Route path="/room-in-shareholder" element={<PropertyDescriptionForm />} />
        <Route path="/search-results" element={<SearchResultsPage />} />
        <Route path="/listing-details/:id" element={<ListingDetailsPage />} />
        <Route path="/inbox" element={<MessagesInbox />} />
        <Route path="/edit-listing/:listingId" element={<PropertyDescriptionForm />} />
        <Route path="/Daeshboard" element={<Dashboard />} />
        <Route path="/need-place" element={<WantedRoomForm />} />
        <Route path="/AccommodationForm" element={<AccommodationForm />} />
        <Route path="/edit-wanted-listing/:id" element={<WantedRoomForm />} />
         <Route path="/staff/register" element={<StaffRegister />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        // Change the route to use AccommodationForm instead
        <Route path="/edit-pg-listing/:id" element={<AccommodationForm editMode={true} />} />
        <Route path="/support" element={<CustomerSupport />} /><Route path="/accommodation-form" element={<AccommodationForm />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
