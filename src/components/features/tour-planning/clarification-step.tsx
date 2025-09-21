
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PiggyBank, Wallet, Diamond, Plane, Train, Car, Bus, Bike, Mountain, Waves, Castle, Utensils, Sun, Palette, Landmark, Users, Heart, User, CheckCircle } from 'lucide-react';
import type { TripDetails } from '@/lib/types';
import { useEffect, useState } from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { addDays, format } from 'date-fns';
import { Pills, Pill, PillsContainer } from '@/components/ui/pills';
import { FriendList } from './friend-list';

const formSchema = z.object({
  destination: z.string()
    .min(1, 'Please enter a destination.')
    .refine(value => value.split(',').length >= 2 || value.split(' ').length >= 2, {
        message: "Please enter a more specific destination (e.g., 'State, City')."
    }),
  budget: z.string().min(1, 'What is your budget?'),
  travelDates: z.object({
      from: z.date({required_error: "Please select a start date."}),
      to: z.date({required_error: "Please select an end date."}),
    }).refine(data => data.from && data.to, 'Please select a date range.'),
  tripType: z.string().min(1, 'Please select a trip type.'),
  adults: z.coerce.number().min(1, 'There must be at least one adult.'),
  kids: z.coerce.number().min(0, 'Number of kids cannot be negative.').default(0),
  kidAges: z.array(z.coerce.number().min(0, "Age can't be negative.")).optional(),
  interests: z.array(z.string()).min(1, 'Please select at least one interest.'),
  modeOfTravel: z.string().min(1, 'How will you travel?'),
});

type FormValues = z.infer<typeof formSchema>;

type ClarificationStepProps = {
  tripDetails: TripDetails;
  onNext: (data: Omit<TripDetails, 'tripDescription'>) => void;
  isLoading: boolean;
};

const travelModes = [
  { value: 'Flight', label: 'Flight', icon: Plane },
  { value: 'Train', label: 'Train', icon: Train },
  { value: 'Car', label: 'Car', icon: Car },
  { value: 'Bus', label: 'Bus', icon: Bus },
  { value: 'Bike', label: 'Bike', icon: Bike },
];

const budgetOptions = [
    { value: 'Budget-friendly', label: 'Budget', icon: PiggyBank },
    { value: 'Mid-range', label: 'Mid-range', icon: Wallet },
    { value: 'Luxury', label: 'Luxury', icon: Diamond },
];

const tripTypes = [
    { value: 'Family', label: 'Family', icon: Users },
    { value: 'Friends', label: 'Friends', icon: Users },
    { value: 'Couples', label: 'Couples', icon: Heart },
    { value: 'Solo', label: 'Solo', icon: User },
];

const interests = [
    { value: 'Hiking', label: 'Hiking', icon: Mountain },
    { value: 'Beach', label: 'Beach', icon: Waves },
    { value: 'History', label: 'History', icon: Castle },
    { value: 'Food', label: 'Food', icon: Utensils },
    { value: 'Cycling', label: 'Cycling', icon: Bike },
    { value: 'Relaxation', label: 'Relaxing', icon: Sun },
    { value: 'Art', label: 'Art', icon: Palette },
    { value: 'Cities', label: 'Cities', icon: Landmark },
  ];

export function ClarificationStep({ tripDetails, onNext, isLoading }: ClarificationStepProps) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: tripDetails.destination || '',
      budget: tripDetails.budget || 'Mid-range',
      travelDates: { from: new Date(), to: addDays(new Date(), 5) },
      tripType: tripDetails.tripType || 'Family',
      adults: tripDetails.adults || 1,
      kids: tripDetails.kids || 0,
      kidAges: tripDetails.kidAges?.split(',').filter(a => a).map(Number) || [],
      interests: tripDetails.interests?.split(',').filter(i => i) || [],
      modeOfTravel: tripDetails.modeOfTravel || '',
    },
  });

  const numberOfKids = form.watch('kids');
  const tripType = form.watch('tripType');

  useEffect(() => {
    const initialDate = new Date();
    form.reset({
      destination: tripDetails.destination || '',
      budget: tripDetails.budget || 'Mid-range',
      travelDates: { from: initialDate, to: addDays(initialDate, 5) },
      tripType: tripDetails.tripType || 'Family',
      adults: tripDetails.adults || 1,
      kids: tripDetails.kids || 0,
      kidAges: tripDetails.kidAges?.split(',').filter(a => a).map(Number) || [],
      interests: tripDetails.interests?.split(',').filter(i => i) || [],
      modeOfTravel: tripDetails.modeOfTravel || '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripDetails]);
  
  useEffect(() => {
    const currentAges = form.getValues('kidAges') || [];
    if (numberOfKids > currentAges.length) {
      const newAges = [...currentAges, ...Array(numberOfKids - currentAges.length).fill(0)];
      form.setValue('kidAges', newAges);
    } else if (numberOfKids < currentAges.length) {
      form.setValue('kidAges', currentAges.slice(0, numberOfKids));
    }
  }, [numberOfKids, form]);

  const handleFormSubmit = (data: FormValues) => {
    const kidAgesString = data.kidAges?.join(',') || '';
    const travelDatesString = data.travelDates.to 
        ? `${format(data.travelDates.from, 'LLL dd, y')} - ${format(data.travelDates.to, 'LLL dd, y')}`
        : format(data.travelDates.from, 'LLL dd, y');
    console.log('Invited friends:', selectedFriends);
    onNext({ ...data, kidAges: kidAgesString, travelDates: travelDatesString, interests: data.interests?.join(',') });
  };

  return (
    <div className="py-2">
        <div className="text-left mb-4">
          <h1 className="font-headline text-md font-bold">Please confirm your trip details</h1>
          <p className="text-muted-foreground text-sm mt-1">
            I've filled this out based on your request. Please confirm or edit below.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tamil Nadu, Coimbatore" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="travelDates"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Travel Dates</FormLabel>
                     <DateRangePicker
                        date={field.value}
                        onDateChange={field.onChange}
                      />
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <FormField
                control={form.control}
                name="tripType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip type?</FormLabel>
                    <FormControl>
                        <PillsContainer>
                            {tripTypes.map(option => (
                                <Pill 
                                    key={option.value}
                                    onClick={() => field.onChange(option.value)}
                                    selected={field.value === option.value}
                                >
                                    <option.icon className="mr-2 h-4 w-4" />
                                    {option.label}
                                </Pill>
                            ))}
                        </PillsContainer>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            {tripType === 'Friends' && (
              <FriendList onSelectionChange={setSelectedFriends} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adults"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adults</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kids</FormLabel>
                    <FormControl>
                       <Input type="number" placeholder="e.g., 0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {numberOfKids > 0 && (
               <div className="space-y-4 rounded-md border p-4">
                 <FormLabel>Ages of Kids</FormLabel>
                 <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: numberOfKids }).map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`kidAges.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Kid {index + 1}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Age" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                 </div>
               </div>
            )}
            
            <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                        <PillsContainer>
                            {budgetOptions.map(option => (
                                <Pill 
                                    key={option.value}
                                    onClick={() => field.onChange(option.value)}
                                    selected={field.value === option.value}
                                >
                                    <option.icon className="mr-2 h-4 w-4" />
                                    {option.label}
                                </Pill>
                            ))}
                        </PillsContainer>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modeOfTravel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode of Travel</FormLabel>
                    <FormControl>
                       <PillsContainer>
                            {travelModes.map(option => (
                                <Pill 
                                    key={option.value}
                                    onClick={() => field.onChange(option.value)}
                                    selected={field.value === option.value}
                                >
                                    <option.icon className="mr-2 h-4 w-4" />
                                    {option.label}
                                </Pill>
                            ))}
                        </PillsContainer>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
           
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                   <Pills
                        options={interests}
                        selected={field.value || []}
                        onChange={field.onChange}
                   />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Confirm & Find Places
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}

    