import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Training = () => {
  const { userId } = useAuth();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // Fetch user's profile data
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const exercises = [
    {
      id: "run",
      title: "Running/Walking",
      description: "3km at your own pace",
      duration: "30 minutes",
      instructions: "Start slow and gradually increase your pace. Listen to your body.",
      contribution: 50,
      experiencePoints: 100
    },
    {
      id: "pushups",
      title: "Push-ups",
      description: "5 push-ups",
      duration: "5 minutes",
      instructions: "Keep your core tight and back straight. Modify on knees if needed.",
      contribution: 50,
      experiencePoints: 50
    }
  ];

  const handleStartExercise = (id: string) => {
    setActiveTask(id);
    toast({
      title: "Exercise Started",
      description: "Good luck! Remember to stay hydrated.",
    });
  };

  const handleCompleteExercise = async (id: string, contribution: number, experiencePoints: number) => {
    if (!userId || !profile) return;

    setActiveTask(null);
    setDailyProgress(prev => Math.min(100, prev + contribution));
    setOverallProgress(prev => Math.min(100, prev + (contribution * 0.2)));

    const newExperiencePoints = (profile.experience_points || 0) + experiencePoints;
    const newLevel = Math.floor(newExperiencePoints / 1000) + 1;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          experience_points: newExperiencePoints,
          level: newLevel
        })
        .eq('id', userId);

      if (error) throw error;

      // Refetch profile data to update UI
      refetchProfile();

      toast({
        title: "Exercise Completed!",
        description: `Gained ${experiencePoints} XP! Keep up the great work!`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating experience:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Today's Training</h1>
        {profile && (
          <div className="mt-2 text-sm text-gray-600">
            Level {profile.level || 1} • {profile.experience_points || 0} XP
          </div>
        )}
      </div>
      
      <div className="space-y-6 mb-8">
        <AnimatedProgressBar
          progress={dailyProgress}
          title="Daily Training Progress"
          color="bg-blue-500"
        />
        <AnimatedProgressBar
          progress={overallProgress}
          title="Overall Fitness Goals"
          color="bg-green-500"
        />
      </div>

      <div className="space-y-4">
        {exercises.map((exercise) => (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{exercise.title}</h3>
                <p className="text-sm text-gray-600">{exercise.description}</p>
                <p className="text-sm text-gray-500 mt-1">Duration: {exercise.duration}</p>
                <p className="text-sm text-green-600">+{exercise.experiencePoints} XP</p>
              </div>
              <Button
                variant={activeTask === exercise.id ? "secondary" : "default"}
                size="sm"
                onClick={() => 
                  activeTask === exercise.id 
                    ? handleCompleteExercise(exercise.id, exercise.contribution, exercise.experiencePoints)
                    : handleStartExercise(exercise.id)
                }
              >
                {activeTask === exercise.id ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Instructions:</h4>
              <p className="text-sm text-gray-600">{exercise.instructions}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Training;