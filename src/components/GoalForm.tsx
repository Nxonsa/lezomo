import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getRandomBibleQuote } from "@/utils/notifications";
import GoalFormHeader from "./goal/GoalFormHeader";
import DailyTasksSection from "./goal/DailyTasksSection";
import ResourceLinksSection from "./goal/ResourceLinksSection";

interface GoalFormProps {
  goalText: string;
  setGoalText: (text: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onClose: () => void;
}

const GoalForm = ({ goalText, setGoalText, endDate, setEndDate, onClose }: GoalFormProps) => {
  const { toast } = useToast();
  const [dailyTasks, setDailyTasks] = useState<string[]>([""]);
  const [resourceLinks, setResourceLinks] = useState<string[]>([""]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a goal",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          goal_text: goalText,
          end_date: new Date(endDate).toISOString(),
          daily_tasks: dailyTasks.filter(task => task.trim() !== ""),
          resource_links: resourceLinks.filter(link => link.trim() !== ""),
          user_id: userId
        })
        .select();

      if (error) throw error;

      const { quote, reference, message } = getRandomBibleQuote(true);
      toast({
        title: message,
        description: `"${quote}" - ${reference}`,
      });
      
      onClose();
      setGoalText("");
      setEndDate("");
    } catch (error) {
      console.error("Error creating goal:", error);
      const { quote, reference, message } = getRandomBibleQuote(false);
      toast({
        title: message,
        description: `"${quote}" - ${reference}`,
        variant: "destructive",
      });
    }
  };

  const addDailyTask = () => setDailyTasks([...dailyTasks, ""]);
  const addResourceLink = () => setResourceLinks([...resourceLinks, ""]);
  const updateDailyTask = (index: number, value: string) => {
    const newTasks = [...dailyTasks];
    newTasks[index] = value;
    setDailyTasks(newTasks);
  };
  const updateResourceLink = (index: number, value: string) => {
    const newLinks = [...resourceLinks];
    newLinks[index] = value;
    setResourceLinks(newLinks);
  };
  const removeDailyTask = (index: number) => {
    setDailyTasks(dailyTasks.filter((_, i) => i !== index));
  };
  const removeResourceLink = (index: number) => {
    setResourceLinks(resourceLinks.filter((_, i) => i !== index));
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 shadow-sm mb-8"
      onSubmit={handleSubmitGoal}
    >
      <GoalFormHeader />
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="goal">What's your goal?</Label>
          <Input
            id="goal"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="Enter your goal here"
            required
            className="bg-[#FEF7CD] placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label htmlFor="endDate">Target completion date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="bg-[#FDE1D3]"
          />
        </div>

        <DailyTasksSection
          dailyTasks={dailyTasks}
          updateDailyTask={updateDailyTask}
          removeDailyTask={removeDailyTask}
          addDailyTask={addDailyTask}
        />

        <ResourceLinksSection
          resourceLinks={resourceLinks}
          updateResourceLink={updateResourceLink}
          removeResourceLink={removeResourceLink}
          addResourceLink={addResourceLink}
        />

        <div className="flex space-x-2">
          <Button type="submit" className="bg-[#F2FCE2] hover:bg-[#E5DEFF] text-black">
            Set Goal
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-[#FFDEE2] hover:bg-red-200"
          >
            Cancel
          </Button>
        </div>
      </div>
    </motion.form>
  );
};

export default GoalForm;