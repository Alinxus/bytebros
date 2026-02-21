/*--------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
import React from 'react'

/*
|-------------------------------------------------------------
| Custom Imports
|-------------------------------------------------------------
*/
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Footer from '@/components/Footer'


/*
|--------------------------------------------------------------
| Home Page
|-------------------------------------------------------------
*/

function Home() {
  return (
    <>
    <Navbar/>
    <main>
       <Hero/>
       <Features/>
       <HowItWorks/>
    </main>
    <Footer/>
    </>
        
  )
}

export default Home