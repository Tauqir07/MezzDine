import { BrowserRouter,Routes,Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import ChatInbox from "./pages/ChatInbox";

import MyRooms from "./features/rooms/MyRooms";
import CreateRoom from "./features/rooms/CreateRoom";
import RoomDetails from "./features/rooms/RoomDetails";
import AvailableRooms from "./features/rooms/AvailableRooms";
import EditRoom from "./EditRooms/EditRooms";

import MyKitchens from "./features/kitchens/MyKitchen";
import AddKitchen from "./features/kitchens/addkitchen";
import AvailableKitchens from "./features/kitchens/AvailableKitchens";
import KitchenDetails from "./features/kitchens/KitchenDetails";
import CreateMenu from "./features/kitchens/CreateMenu";
import EditKitchens from "./features/kitchens/EditKitchens";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./footer/Footer";
import UserDashboard from "./pages/UserDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import RoomDashboard from "./pages/RoomDashboard";
import NotificationPage from "./pages/NotificationPage";
import "leaflet/dist/leaflet.css";
import useGPSLocation from "./hooks/useGPSLocation";
import TermsAndConditions  from "./footer/Terms&Conditions/Terms&Conditions";
import PrivacyPolicy        from "./footer/PrivacyPolicy/PrivacyPolicy";
import SafetyGuidelines     from "./footer/Safety/SafetyGuidelines";
import CommunityStandards   from "./footer/Community/CommunityStandards";
import ReportProblem        from "./footer/report/ReportProblem";
import ContactPage from "./footer/Contact/ContactPage";
import ScrollToTop from "./scrolltotop/scrolltotop";
function App(){
useGPSLocation();
return(

<BrowserRouter>
<ScrollToTop />
<Navbar/>
<div style={{ paddingTop: "64px" }}></div>
<Routes>

<Route path="/" element={<Home/>}/>
<Route path="/login" element={<Login/>}/>
<Route path="/register" element={<Register/>}/>


<Route
  path="/my-subscription"
  element={
    <ProtectedRoute role="user">
      <UserDashboard/>
    </ProtectedRoute>
  }
/>

<Route
  path="/chat"
  element={
    <ProtectedRoute>
      <ChatInbox/>
    </ProtectedRoute>
  }
/>

<Route
  path="/chat/:id"
  element={
    <ProtectedRoute>
      <ChatPage/>
    </ProtectedRoute>
  }
/>

<Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />

{/* ── ROOMS ── specific routes before /:id ── */}
<Route path="/rooms" element={<AvailableRooms/>}/>

<Route
  path="/rooms/my"
  element={
    <ProtectedRoute role="roomProvider">
      <MyRooms/>
    </ProtectedRoute>
  }
/>
<Route
  path="/rooms/dashboard/:roomId"
  element={<ProtectedRoute role="roomProvider"><RoomDashboard/></ProtectedRoute>}
/>
<Route
  path="/rooms/create"
  element={
    <ProtectedRoute role="roomProvider">
      <CreateRoom/>
    </ProtectedRoute>
  }
/>

<Route
  path="/rooms/edit/:roomId"
  element={
    <ProtectedRoute role="roomProvider">
      <EditRoom/>
    </ProtectedRoute>
  }
/>

{/* wildcard last */}
<Route path="/rooms/:id" element={<RoomDetails/>}/>

{/* ── KITCHENS ── specific routes before /:id ── */}
<Route path="/kitchens" element={<AvailableKitchens/>}/>

<Route
  path="/kitchens/dashboard/:kitchenId"
  element={
    <ProtectedRoute role="kitchenOwner">
      <KitchenDashboard/>
    </ProtectedRoute>
  }
/>

<Route
  path="/kitchens/my"
  element={
    <ProtectedRoute role="kitchenOwner">
      <MyKitchens/>
    </ProtectedRoute>
  }
/>

<Route
  path="/kitchens/add"
  element={
    <ProtectedRoute role="kitchenOwner">
      <AddKitchen/>
    </ProtectedRoute>
  }
/>

<Route
  path="/kitchens/menu/:kitchenId"
  element={
    <ProtectedRoute role="kitchenOwner">
      <CreateMenu/>
    </ProtectedRoute>
  }
/>

<Route
  path="/kitchens/edit/:id"
  element={
    <ProtectedRoute role="kitchenOwner">
      <EditKitchens/>
    </ProtectedRoute>
  }
/>

{/* wildcard last */}
<Route path="/kitchens/:id" element={<KitchenDetails/>}/>

<Route path="*" element={<Home/>}/>
<Route path="/terms"   element={<TermsAndConditions />} />
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/safety"    element={<SafetyGuidelines />} />
<Route path="/community" element={<CommunityStandards />} />
<Route path="/report"    element={<ReportProblem />} />
<Route path="/contact" element={<ContactPage />} />

</Routes>

<Footer/>

</BrowserRouter>

);

}

export default App;