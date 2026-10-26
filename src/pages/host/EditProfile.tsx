import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { SubpageShell, FormSection, AsideBlock } from "@/components/dashboard/Subpage";
import HostBottomNav from "@/components/HostBottomNav";
import { useSignup } from "@/contexts/SignupContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSmartBack } from "@/hooks/use-smart-back";

const EditHostProfile = () => {
  const goBack = useSmartBack("/host/profile");
  const { hostSignupData, propertyData, updateHostSignupData, updatePropertyData } = useSignup();
  const { user } = useAuthContext();
  const { profile, refreshProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyName: '',
  });

  // Initialize form data from profile or signup context
  useEffect(() => {
    if (profile?.full_name) {
      const nameParts = profile.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setFormData({
        firstName,
        lastName,
        email: profile.email || hostSignupData.email || '',
        phone: profile.phone || hostSignupData.phone || '',
        propertyName: propertyData.propertyName || '',
      });
    } else {
      setFormData({
        firstName: hostSignupData.firstName || '',
        lastName: hostSignupData.lastName || '',
        email: profile?.email || hostSignupData.email || '',
        phone: profile?.phone || hostSignupData.phone || '',
        propertyName: propertyData.propertyName || '',
      });
    }
  }, [profile, hostSignupData, propertyData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsSaving(true);
    
    try {
      // Update (or create) the database profile with full_name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const { data: updatedRows, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: formData.phone,
        })
        .eq('user_id', user.id)
        .select('id');

      if (updateError) throw updateError;

      // If no profile row exists yet, create it
      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: fullName || null,
            email: formData.email || null,
            phone: formData.phone || null,
          });

        if (insertError) throw insertError;
      }

      // Update local contexts
      updateHostSignupData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });
      
      updatePropertyData({
        ...propertyData,
        propertyName: formData.propertyName,
      });

      // Refresh the profile context
      await refreshProfile();
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCancel = () => {
    if (profile?.full_name) {
      const nameParts = profile.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setFormData({
        firstName,
        lastName,
        email: profile.email || hostSignupData.email || '',
        phone: profile.phone || hostSignupData.phone || '',
        propertyName: propertyData.propertyName || '',
      });
    } else {
      setFormData({
        firstName: hostSignupData.firstName || '',
        lastName: hostSignupData.lastName || '',
        email: profile?.email || hostSignupData.email || '',
        phone: profile?.phone || hostSignupData.phone || '',
        propertyName: propertyData.propertyName || '',
      });
    }
    setIsEditing(false);
  };

  return (
    <>
      <SubpageShell
        backLabel="Back to profile"
        onBack={goBack}
        eyebrow="Account"
        title="Your details"
        subtitle={isEditing ? "Update your information, then save." : "How vendors and guests can identify and reach you."}
        actions={!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">Edit</Button>
        ) : undefined}
        aside={
          <>
            <AsideBlock title="Who sees this">
              <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
                <li>Your property name heads your guest guide.</li>
                <li>Vendors you invite see your name and email.</li>
                <li>Your phone is only used for booking problems.</li>
              </ul>
            </AsideBlock>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <FormSection title="Name" description="As it appears on vendor invites.">
            <div className="grid gap-5 sm:grid-cols-2">
<div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
<div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
            </div>
          </FormSection>
          <FormSection title="Contact" description="Where we send booking notices.">
            <div className="grid gap-5 sm:grid-cols-2">
<div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
<div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
            </div>
          </FormSection>
          <FormSection title="Property" description="Shown at the top of your guest guide.">
<div className="space-y-2">
              <Label htmlFor="propertyName">Property Name</Label>
              <Input
                id="propertyName"
                name="propertyName"
                value={formData.propertyName}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
          </FormSection>
          {isEditing && (
            <div className="flex justify-end gap-3 py-8">
              <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save changes"}
              </Button>
            </div>
          )}
        </form>
      </SubpageShell>
      <HostBottomNav />
    </>
  );
};

export default EditHostProfile;
