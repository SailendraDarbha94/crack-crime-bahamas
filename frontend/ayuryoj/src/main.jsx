import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'
import Homepage from './pages/homepage/Homepage';
import Signup1 from './pages/signup/client/Signup1';
import Login from './pages/login/Login'
import ClientDashboard from './pages/dashboard/client/ClientDashboard';
import ApplicantDashboard from './pages/dashboard/applicant/ApplicantDashboard';
import PostJob from './pages/jobPost/PostJob';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Homepage/>,
  },
  {
    path: "/signup/client",
    element: <Signup1/>,
  },
  {
    path: "/login",
    element: <Login/>,
  },
  {
    path: "/dashboard1",
    element: <ClientDashboard/>,
  },
  {
    path: "/dashboard2",
    element: <ApplicantDashboard/>,
  },
  {
    path: "/post-a-job",
    element: <PostJob/>,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
