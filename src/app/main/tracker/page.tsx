'use client'

import StudentList from "@/common/StudentList";
import TrackerLayout from "@/components/Tracker";
import { useUser } from "@/providers/UserContext";

export default function TrackerStudentsPage() {

  const {user} = useUser()
  return user?.role === 'super_admin' ? <StudentList link='tracker' /> : <TrackerLayout />
}