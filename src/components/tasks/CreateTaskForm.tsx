
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const CreateTaskForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    minBudget: "",
    maxBudget: "",
    address: "",
    paymentMethod: "cash"
  });
  const { toast } = useToast();

  const categories = {
    "dulap": ["PAX", "HEMNES", "BRIMNES", "MALM", "Altele"],
    "birou": ["LINNMON", "BEKANT", "GALANT", "MICKE", "Altele"],
    "pat": ["MALM", "HEMNES", "BRIMNES", "TARVA", "Altele"],
    "comoda": ["HEMNES", "MALM", "RAST", "KOPPANG", "Altele"],
    "masa": ["INGATORP", "BJURSTA", "LERHAMN", "MÖRBYLÅNGA", "Altele"],
    "raft": ["BILLY", "HEMNES", "FJÄLKINGE", "IVAR", "Altele"]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.subcategory) {
      toast({
        title: "Eroare",
        description: "Te rog să selectezi categoria și subcategoria.",
        variant: "destructive",
      });
      return;
    }

    console.log("Creating task:", formData);
    toast({
      title: "Task creat cu succes!",
      description: "Task-ul tău a fost postat și va fi vizibil pentru taskeri.",
    });

    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "",
      subcategory: "",
      minBudget: "",
      maxBudget: "",
      address: "",
      paymentMethod: "cash"
    });
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Creează un task nou</CardTitle>
        <CardDescription>
          Descrie ce ai nevoie să asamblezi și primește oferte de la taskeri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Titlul task-ului</Label>
            <Input
              id="title"
              placeholder="ex: Asamblare dulap IKEA PAX"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrierea detaliată</Label>
            <Textarea
              id="description"
              placeholder="Descrie ce anume trebuie asamblat, dimensiuni, particularități..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selectează categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dulap">Dulap</SelectItem>
                  <SelectItem value="birou">Birou</SelectItem>
                  <SelectItem value="pat">Pat</SelectItem>
                  <SelectItem value="comoda">Comodă</SelectItem>
                  <SelectItem value="masa">Masă</SelectItem>
                  <SelectItem value="raft">Raft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategoria / Model</Label>
              <Select 
                value={formData.subcategory} 
                onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                disabled={!formData.category}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selectează modelul" />
                </SelectTrigger>
                <SelectContent>
                  {formData.category && categories[formData.category as keyof typeof categories]?.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minBudget">Budget minim (RON)</Label>
              <Input
                id="minBudget"
                type="number"
                placeholder="100"
                value={formData.minBudget}
                onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxBudget">Budget maxim (RON)</Label>
              <Input
                id="maxBudget"
                type="number"
                placeholder="200"
                value={formData.maxBudget}
                onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adresa</Label>
            <Input
              id="address"
              placeholder="Strada, numărul, sectorul..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Metoda de plată</Label>
            <RadioGroup 
              value={formData.paymentMethod} 
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank">Transfer bancar</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Postează task-ul
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTaskForm;
