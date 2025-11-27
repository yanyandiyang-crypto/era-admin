import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface BroadcastNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TargetAudience = 'personnel' | 'public';

type Preset = {
  value: string;
  label: string;
  title: string;
  message: string;
};

const presets: Preset[] = [
  { value: 'maintenance', label: 'System Maintenance', title: 'System Maintenance Scheduled', message: 'The system will be undergoing scheduled maintenance from 2:00 AM to 4:00 AM tonight. Please save your work.' },
  { value: 'emergency', label: 'Emergency Alert', title: '🚨 EMERGENCY ALERT', message: 'Immediate response required. Check incidents for details.' },
  { value: 'training', label: 'Training Reminder', title: 'Training Session Tomorrow', message: "Don't forget your mandatory training session tomorrow at 9:00 AM at the station." },
  { value: 'meeting', label: 'Team Meeting', title: 'Team Briefing at 10 AM', message: 'All personnel required to attend the daily briefing at 10:00 AM.' },
  { value: 'general', label: 'General Announcement', title: 'Important Update', message: 'Please review the latest policy updates in the reports section.' },
  { value: 'weather', label: 'Weather Alert', title: 'Weather Advisory', message: 'Severe weather expected. Take necessary precautions and stay updated.' },
  { value: 'power', label: 'Power Outage', title: 'Power Interruption Notice', message: 'Scheduled power maintenance will cause temporary outages in the area.' },
  { value: 'security', label: 'Security Update', title: 'Security Alert', message: 'Enhanced security measures are now in effect. Please follow updated protocols.' },
  { value: 'evacuation', label: 'Evacuation Alert', title: '🚨 EVACUATION ORDER', message: 'Immediate evacuation required. Proceed to designated safe zones.' },
  { value: 'medical', label: 'Medical Emergency', title: 'Medical Emergency', message: 'Medical assistance needed. Responders please check incident details.' },
  { value: 'fire', label: 'Fire Alert', title: '🔥 FIRE EMERGENCY', message: 'Fire reported in the area. All units respond immediately.' },
  { value: 'traffic', label: 'Traffic Incident', title: 'Traffic Alert', message: 'Major traffic incident reported. Expect delays and use alternate routes.' },
  { value: 'suspicious', label: 'Suspicious Activity', title: 'Suspicious Activity Report', message: 'Suspicious activity reported. Increased vigilance required.' },
  { value: 'equipment', label: 'Equipment Failure', title: 'Equipment Malfunction', message: 'Critical equipment failure detected. Technical team notified.' },
  { value: 'shift', label: 'Shift Change', title: 'Shift Change Notification', message: 'Shift change in progress. Ensure smooth handover of responsibilities.' },
  { value: 'policy', label: 'Policy Update', title: 'Policy Update', message: 'New policies implemented. Please review the updated guidelines.' },
  { value: 'drill', label: 'Emergency Drill', title: 'Emergency Drill', message: 'Scheduled emergency drill commencing. Follow standard procedures.' },
  { value: 'community', label: 'Community Event', title: 'Community Event', message: 'Local community event scheduled. Increased patrols recommended.' },
];

export function BroadcastNotificationDialog({
  open,
  onOpenChange,
}: BroadcastNotificationDialogProps) {
  const { socket } = useSocket();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [audiences, setAudiences] = useState<Set<TargetAudience>>(new Set(['personnel']));
  const [preset, setPreset] = useState('');

  const selectedPresetLabel = preset ? presets.find(p => p.value === preset)?.label : '';

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const selectedPreset = presets.find(p => p.value === value);
    if (selectedPreset) {
      setTitle(selectedPreset.title);
      setMessage(selectedPreset.message);
    }
  };

  const handleAudienceChange = (audience: TargetAudience) => {
    setAudiences((prev) => {
      const newAudiences = new Set(prev);
      if (newAudiences.has(audience)) {
        newAudiences.delete(audience);
      } else {
        newAudiences.add(audience);
      }
      return newAudiences;
    });
  };

  const handleBroadcast = () => {
    if (!socket) {
      toast.error('Not connected to the notification server.');
      return;
    }
    if (!title.trim() || !message.trim() || audiences.size === 0) {
      toast.warning('Title, message, and at least one audience are required.');
      return;
    }

    const notificationPayload = {
      title,
      message,
      type,
      targets: Array.from(audiences), // 'personnel', 'public'
    };

    socket.emit('notification:broadcast', notificationPayload, (ack: { success: boolean }) => {
        if (ack && ack.success) {
          toast.success('Notification broadcasted successfully!');
          onOpenChange(false);
          // Reset form
          setTitle('');
          setMessage('');
          setType('info');
          setAudiences(new Set(['personnel']));
        } else {
          toast.error('Failed to broadcast notification.');
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in-95">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Broadcast Notification</h2>
              <p className="text-sm text-gray-600 mt-1">Send a real-time notification to selected audiences.</p>
            </div>
          </div>        <div className="px-6 py-4 space-y-4">
          {/* Preset Selector */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {selectedPresetLabel || "Choose a template or type your own"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., System Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your notification message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Notification Type</Label>
              <RadioGroup
                value={type}
                onValueChange={setType}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="info" id="info" />
                  <Label htmlFor="info">Info</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alert" id="alert" />
                  <Label htmlFor="alert">Alert</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <Label>Audience</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="personnel"
                    checked={audiences.has('personnel')}
                    onCheckedChange={() => handleAudienceChange('personnel')} />
                  <Label htmlFor="personnel">Personnel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="public"
                    checked={audiences.has('public')}
                    onCheckedChange={() => handleAudienceChange('public')} />
                  <Label htmlFor="public">Public</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBroadcast}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              disabled={!title.trim() || !message.trim() || audiences.size === 0}
            >
              Broadcast Notification
            </Button>
          </div>
        </DialogContent>
    </Dialog>
  );
}

